import { access, readdir, readFile } from 'node:fs/promises'

const controlledRuntimeUrl = 'https://js.inttegro.com/v1/inttegro.js'
const forbiddenRuntimeMarkers = [
  '/embed/checkout/',
  'data-inttegro-checkout',
  'pages.inttegro.com',
]
const forbiddenRuntimeSources = [
  'packages/js/src/checkout.ts',
  'packages/js/src/protocol.ts',
  'packages/js/src/runtime.ts',
  'scripts/verify-runtime-bundle.mjs',
  'runtime',
]

for (const path of forbiddenRuntimeSources) {
  try {
    await access(new URL(`../${path}`, import.meta.url))
  } catch {
    continue
  }
  throw new Error(`Private runtime source cannot be published: ${path}`)
}

for (const path of [
  'packages/js/dist/index.js',
  'packages/js/dist/index.cjs',
]) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  if (!source.includes(controlledRuntimeUrl)) {
    throw new Error(`${path} does not contain the controlled runtime URL.`)
  }
  for (const marker of forbiddenRuntimeMarkers) {
    if (source.includes(marker)) {
      throw new Error(`${path} unexpectedly contains runtime code: ${marker}`)
    }
  }
}

const packageFiles = await readdir(new URL('../packages', import.meta.url), {
  recursive: true,
})
for (const relativePath of packageFiles) {
  const normalizedPath = relativePath.replaceAll('\\', '/')
  if (!/\.(?:c?js|mjs|svelte)$/.test(normalizedPath)) continue
  if (!normalizedPath.includes('/dist/')) continue
  const source = await readFile(
    new URL(`../packages/${normalizedPath}`, import.meta.url),
    'utf8',
  )
  for (const marker of forbiddenRuntimeMarkers) {
    if (source.includes(marker)) {
      throw new Error(
        `packages/${normalizedPath} unexpectedly contains runtime code: ${marker}`,
      )
    }
  }
}

const publicModule = await import(
  new URL('../packages/js/dist/index.js', import.meta.url).href
)
if ('createCheckout' in publicModule) {
  throw new Error(
    '@inttegro/js must not export the executable checkout runtime.',
  )
}
if (typeof publicModule.loadInttegro !== 'function') {
  throw new Error('@inttegro/js must export loadInttegro().')
}

const previousWindow = globalThis.window
const previousDocument = globalThis.document
const scripts = []
class ScriptElement {
  async = false
  crossOrigin = ''
  nonce = ''
  referrerPolicy = ''
  src = ''
  listeners = new Map()

  setAttribute() {}

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener()
  }

  remove() {
    const index = scripts.indexOf(this)
    if (index >= 0) scripts.splice(index, 1)
  }
}

try {
  globalThis.window = {
    clearTimeout,
    setTimeout,
  }
  globalThis.document = {
    scripts,
    createElement: () => new ScriptElement(),
    head: { append: (script) => scripts.push(script) },
  }

  const firstLoad = publicModule.loadInttegro({ nonce: 'request-nonce' })
  const secondLoad = publicModule.loadInttegro()
  if (firstLoad !== secondLoad || scripts.length !== 1) {
    throw new Error('Loader did not deduplicate concurrent runtime requests.')
  }
  const [script] = scripts
  if (
    script.src !== controlledRuntimeUrl ||
    script.crossOrigin !== 'anonymous' ||
    script.nonce !== 'request-nonce' ||
    script.referrerPolicy !== 'origin' ||
    script.async !== true
  ) {
    throw new Error(
      'Loader did not create the required controlled-origin script.',
    )
  }
  const runtime = {
    createCheckout() {},
    protocolVersion: 1,
    version: 'test',
  }
  globalThis.window.Inttegro = runtime
  script.dispatch('load')
  if ((await firstLoad) !== runtime) {
    throw new Error('Loader did not resolve the controlled-origin runtime.')
  }
} finally {
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
  if (previousDocument === undefined) delete globalThis.document
  else globalThis.document = previousDocument
}

console.log(
  'Verified that npm packages contain only the controlled-origin loader and adapters.',
)

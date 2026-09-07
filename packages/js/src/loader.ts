import { InttegroCheckoutError } from './error'
import type { InttegroLoadOptions, InttegroRuntime } from './types'

export const INTTEGRO_JS_URL = 'https://js.inttegro.com/v1/inttegro.js'

const LOAD_TIMEOUT_MS = 15_000
const SCRIPT_MARKER = 'data-inttegro-js'
let loadPromise: Promise<InttegroRuntime | null> | undefined

export function loadInttegro(
  options: InttegroLoadOptions = {},
): Promise<InttegroRuntime | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  loadPromise ??= loadRuntime(options).catch((error: unknown) => {
    loadPromise = undefined
    throw error
  })
  return loadPromise
}

async function loadRuntime(
  options: InttegroLoadOptions,
): Promise<InttegroRuntime> {
  const existingScript = findRuntimeScript()
  if (existingScript) {
    const runtime = readRuntime()
    if (runtime) return runtime
    return waitForRuntime(existingScript, false)
  }

  if (readWindowRuntime()) {
    throw new InttegroCheckoutError(
      'invalid_runtime',
      `Inttegro was initialized without the required ${INTTEGRO_JS_URL} script.`,
    )
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.referrerPolicy = 'origin'
  script.src = INTTEGRO_JS_URL
  script.setAttribute(SCRIPT_MARKER, 'v1')
  if (options.nonce) script.nonce = options.nonce

  const runtime = waitForRuntime(script, true)
  document.head.append(script)
  return runtime
}

function waitForRuntime(
  script: HTMLScriptElement,
  removeOnFailure: boolean,
): Promise<InttegroRuntime> {
  return new Promise((resolve, reject) => {
    let timeout: number

    const cleanup = () => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
    const handleLoad = () => {
      cleanup()
      try {
        resolve(requireRuntime())
      } catch (error) {
        if (removeOnFailure) script.remove()
        reject(error)
      }
    }
    const handleError = () => {
      cleanup()
      if (removeOnFailure) script.remove()
      reject(
        new InttegroCheckoutError(
          'runtime_load_failed',
          `Could not load the Inttegro-hosted JavaScript runtime from ${INTTEGRO_JS_URL}.`,
        ),
      )
    }

    timeout = window.setTimeout(() => {
      cleanup()
      if (removeOnFailure) script.remove()
      reject(
        new InttegroCheckoutError(
          'runtime_load_timeout',
          'The Inttegro-hosted JavaScript runtime did not load in time.',
        ),
      )
    }, LOAD_TIMEOUT_MS)

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
  })
}

function findRuntimeScript(): HTMLScriptElement | undefined {
  return [...document.scripts].find((script) => script.src === INTTEGRO_JS_URL)
}

function requireRuntime(): InttegroRuntime {
  const runtime = readRuntime()
  if (runtime) return runtime
  throw new InttegroCheckoutError(
    'invalid_runtime',
    'The Inttegro-hosted script loaded without a compatible runtime.',
  )
}

function readRuntime(): InttegroRuntime | undefined {
  if (!findRuntimeScript()) return undefined
  const runtime = readWindowRuntime()
  if (
    !runtime ||
    runtime.protocolVersion !== 1 ||
    typeof runtime.version !== 'string' ||
    typeof runtime.createCheckout !== 'function'
  ) {
    return undefined
  }
  return runtime
}

function readWindowRuntime(): InttegroRuntime | undefined {
  return (window as Window & { Inttegro?: InttegroRuntime }).Inttegro
}

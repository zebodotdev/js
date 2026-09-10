import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDirectory = fileURLToPath(
  new URL('../build/api-docs/', import.meta.url),
)

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return listHtmlFiles(path)
      return entry.name.endsWith('.html') ? [path] : []
    }),
  )
  return files.flat()
}

const htmlFiles = await listHtmlFiles(outputDirectory)
const pages = await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')))
const generatedHtml = pages.join('\n')
const customCss = await readFile(
  join(outputDirectory, 'assets/custom.css'),
  'utf8',
)
const customJs = await readFile(
  join(outputDirectory, 'assets/custom.js'),
  'utf8',
)

const requiredDocumentation = [
  'Get started with Checkout',
  'Framework adapters',
  'Lifecycle, events, and reconciliation',
  'Security, CSP, and accessibility',
  'Owns the lifecycle of one hosted Checkout instance',
  'Loads and validates the Inttegro-hosted Checkout runtime',
  'Emitted when payer input changes the completion state of the form',
  'Displays Inttegro-hosted Checkout in a React application',
  'Displays Inttegro-hosted Checkout in a Vue application',
  'Standalone Angular component that embeds Inttegro-hosted Checkout',
]

const stableDocumentRoutes = [
  'Angular.html',
  'Framework_adapters.html',
  'Get_started_with_Checkout.html',
  'Inertia.html',
  'Lifecycle_and_reconciliation.html',
  'React.html',
  'Security,_CSP,_and_accessibility.html',
  'Svelte.html',
  'Vue.html',
]

const failures = []

for (const text of requiredDocumentation) {
  if (!generatedHtml.includes(text))
    failures.push(`missing documentation: ${text}`)
}

for (const route of stableDocumentRoutes) {
  if (!htmlFiles.some((file) => file.endsWith(join('documents', route)))) {
    failures.push(`missing stable document route: ${route}`)
  }
}

if (
  !/https:\/\/github\.com\/zebodotdev\/js\/blob\/[0-9a-f]{40}\/packages\/.+?#L\d+/.test(
    generatedHtml,
  )
) {
  failures.push('missing immutable GitHub source links')
}

if (!customCss.includes('--dark-color-background: #000000')) {
  failures.push('dark theme does not use a black page background')
}

if (!customCss.includes('--light-color-background: #ffffff')) {
  failures.push('light theme does not use a white page background')
}

for (const installer of ['npm', 'yarn', 'bun', 'deno']) {
  if (!customJs.includes(`${installer}: {`)) {
    failures.push(`missing ${installer} installer logo`)
  }
}

if (
  !customJs.includes('inttegro-install-tablist') ||
  !customJs.includes("setAttribute('role', 'tablist')") ||
  !customJs.includes("setAttribute('aria-selected'")
) {
  failures.push('missing accessible installer tab behavior')
}

if (
  !customJs.includes('documentLogos') ||
  !customJs.includes('inttegro-site-nav-logo')
) {
  failures.push('missing framework logos in document navigation')
}

if (
  !customJs.includes('navigationSections') ||
  !customJs.includes('organizeSiteNavigation') ||
  !customJs.includes("label: 'Guides'") ||
  !customJs.includes("label: 'Framework adapters'") ||
  !customJs.includes("replaceChildren('API reference')") ||
  !customJs.includes(
    "apiDetails.open = Boolean(apiDetails.querySelector('a.current'))",
  )
) {
  failures.push('missing grouped documentation navigation')
}

if (!generatedHtml.includes('assets/custom.js?v=')) {
  failures.push('generated documentation does not load the UI enhancements')
}

if (!generatedHtml.includes('assets/custom.css?v=')) {
  failures.push('generated documentation does not load the branded theme')
}

if (
  generatedHtml.includes('assets/custom.js"') ||
  generatedHtml.includes('assets/custom.css"')
) {
  failures.push('custom documentation assets are not cache fingerprinted')
}

if (failures.length > 0) {
  throw new Error(
    `Generated API documentation verification failed:\n- ${failures.join('\n- ')}`,
  )
}

console.log(
  `Verified ${htmlFiles.length} generated documentation pages, source permalinks, guides, branded installer tabs, cache-safe assets, and light/dark themes.`,
)

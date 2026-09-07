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

const requiredDocumentation = [
  'Get started with Checkout',
  'Framework adapters',
  'Lifecycle, events, and reconciliation',
  'Security, CSP, and accessibility',
  'Owns the lifecycle of one embedded hosted Checkout instance',
  'Loads and validates the Inttegro-hosted Checkout runtime',
  'Emitted when payer input changes the completion state of the form',
  'Embeds Inttegro-hosted Checkout in a React application',
  'Embeds Inttegro-hosted Checkout in a Vue application',
  'Standalone Angular component that embeds Inttegro-hosted Checkout',
]

const failures = []

for (const text of requiredDocumentation) {
  if (!generatedHtml.includes(text))
    failures.push(`missing documentation: ${text}`)
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

if (failures.length > 0) {
  throw new Error(
    `Generated API documentation verification failed:\n- ${failures.join('\n- ')}`,
  )
}

console.log(
  `Verified ${htmlFiles.length} generated documentation pages, source permalinks, guides, and light/dark themes.`,
)

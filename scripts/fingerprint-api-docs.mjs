import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
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

function fingerprint(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

const customCss = await readFile(
  join(outputDirectory, 'assets/custom.css'),
  'utf8',
)
const customJs = await readFile(
  join(outputDirectory, 'assets/custom.js'),
  'utf8',
)
const fingerprints = {
  'custom.css': fingerprint(customCss),
  'custom.js': fingerprint(customJs),
}

const htmlFiles = await listHtmlFiles(outputDirectory)
await Promise.all(
  htmlFiles.map(async (file) => {
    let html = await readFile(file, 'utf8')
    for (const [asset, hash] of Object.entries(fingerprints)) {
      html = html.replaceAll(`assets/${asset}`, `assets/${asset}?v=${hash}`)
    }
    await writeFile(file, html)
  }),
)

console.log(
  `Fingerprint-stamped custom API documentation assets in ${htmlFiles.length} pages.`,
)

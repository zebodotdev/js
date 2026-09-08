import { readFile } from 'node:fs/promises'

const manifestUrl = 'https://js.inttegro.com/manifest.json'
const runtimeUrl = 'https://js.inttegro.com/inttegro.js@0.1.0'
const response = await fetch(manifestUrl, {
  cache: 'no-store',
  headers: { 'cache-control': 'no-cache' },
  redirect: 'error',
})

if (!response.ok) {
  throw new Error(`Hosted runtime manifest returned HTTP ${response.status}.`)
}
if (response.url !== manifestUrl) {
  throw new Error(
    `Runtime manifest resolved to an unexpected URL: ${response.url}`,
  )
}

const manifest = await response.json()
const packageMetadata = JSON.parse(
  await readFile(
    new URL('../packages/js/package.json', import.meta.url),
    'utf8',
  ),
)
if (
  !isRecord(manifest) ||
  manifest.runtime !== runtimeUrl ||
  manifest.version !== packageMetadata.version ||
  manifest.protocolVersion !== 1 ||
  typeof manifest.sha256 !== 'string' ||
  !/^[a-f0-9]{64}$/.test(manifest.sha256)
) {
  throw new Error('Hosted runtime manifest is missing or incompatible.')
}

console.log(
  `Verified hosted runtime compatibility at ${manifest.version} (${manifest.sha256}).`,
)

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

import { readFile } from 'node:fs/promises'

const packagePaths = [
  'packages/js/package.json',
  'packages/react/package.json',
  'packages/vue/package.json',
  'packages/svelte/package.json',
  'packages/angular/package.json',
]

const packages = await Promise.all(
  packagePaths.map(async (path) => ({
    path,
    value: JSON.parse(await readFile(new URL(`../${path}`, import.meta.url))),
  })),
)
const versions = new Set(packages.map(({ value }) => value.version))

if (versions.size !== 1) {
  const details = packages
    .map(({ path, value }) => `${path}: ${String(value.version)}`)
    .join('\n')
  throw new Error(
    `All public packages must use one release version:\n${details}`,
  )
}

const [version] = versions
const releaseVersion = process.env.RELEASE_VERSION?.replace(/^v/, '')
if (releaseVersion && releaseVersion !== version) {
  throw new Error(
    `Release tag ${process.env.RELEASE_VERSION} does not match package version ${version}.`,
  )
}

for (const { path, value } of packages) {
  if (value.dependencies?.['@inttegro/js'] !== version) {
    if (value.name !== '@inttegro/js') {
      throw new Error(`${path} must depend on @inttegro/js ${version}.`)
    }
  }
}

console.log(`Verified ${packages.length} packages at ${version}.`)

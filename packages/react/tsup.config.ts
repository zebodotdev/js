import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['@inttegro/js', 'react', 'react/jsx-runtime'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  sourcemap: true,
  splitting: false,
  target: 'es2022',
})

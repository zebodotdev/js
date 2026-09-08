# `@inttegro/js`

Controlled-origin loader and TypeScript types for mounting an
Inttegro-hosted `Checkout` experience. This npm package does not contain the
executable checkout runtime. `loadInttegro()` downloads it from the fixed,
Inttegro-controlled URL `https://js.inttegro.com/inttegro.js@0.2.0`.

```ts
import { loadInttegro } from '@inttegro/js'

const inttegro = await loadInttegro()
if (!inttegro) throw new Error('Checkout requires a browser')

const checkout = inttegro.createCheckout({ orderId: 'or_...' })
checkout.on('completed', () => {
  window.location.assign('/order-complete')
})
await checkout.mount('#checkout')
```

The runtime URL is not configurable. Do not bundle, mirror, proxy, or self-host
it. The mounted iframe is hosted by Inttegro Pages. A restrictive Content
Security Policy must allow `script-src https://js.inttegro.com` and
`frame-src https://pages.inttegro.com`. When using CSP nonces, pass the current
request nonce to `loadInttegro({ nonce })`.

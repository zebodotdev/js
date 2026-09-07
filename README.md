# Inttegro JavaScript SDKs

TypeScript SDKs for embedding Inttegro-hosted workflows in websites and web
applications. The npm packages contain a controlled-origin loader, public
types, and thin framework adapters. The executable checkout runtime is built
separately and served only by Inttegro.

| Package             | Purpose                         |
| ------------------- | ------------------------------- |
| `@inttegro/js`      | Runtime loader and public types |
| `@inttegro/react`   | React `Checkout` component      |
| `@inttegro/vue`     | Vue `Checkout` component        |
| `@inttegro/svelte`  | Svelte `Checkout` component     |
| `@inttegro/angular` | Angular `CheckoutComponent`     |

Inertia applications use the adapter for their frontend renderer. Inertia with
React uses `@inttegro/react`; Inertia with Vue uses `@inttegro/vue`; and Inertia
with Svelte uses `@inttegro/svelte`.

## Architecture

The merchant server creates and finalizes an Order using an Inttegro server
SDK. It returns only the client-safe Order reference to the web application.
The web application mounts `Checkout`. The npm loader first downloads the
executable runtime from `https://js.inttegro.com/v1/inttegro.js`; that runtime
then loads the payment experience from Inttegro Pages in a cross-origin iframe.

```text
Merchant server -> finalized Order -> browser application
                                         |
                                         v
                            npm loader / framework adapter
                                         |
                                         v
                           js.inttegro.com/v1/inttegro.js
                                         |
                                         v
                              Inttegro-hosted Checkout frame
```

Payment fields, confirmation challenges, and Checkout API responses stay in
the Inttegro-hosted frame. The merchant page receives only typed, privacy-safe
lifecycle events.

## Browser usage

```ts
import { loadInttegro } from '@inttegro/js'

const inttegro = await loadInttegro()
if (!inttegro) throw new Error('Checkout requires a browser')

const checkout = inttegro.createCheckout({
  orderId: 'or_...',
  appearance: { theme: 'system' },
  locale: 'en-GH',
})

checkout.on('completed', () => {
  window.location.assign('/orders/complete')
})

checkout.onEvent((event) => {
  analytics.track(`inttegro.checkout.${event.type}`)
})

await checkout.mount('#checkout')
```

The lifecycle stream reports readiness, form state, payment attempts,
confirmation, recoverable failures, completion, cancellation, and SDK errors.
It intentionally excludes payment details, customer data, the Order reference,
and raw provider responses.

## React usage

```tsx
import { Checkout } from '@inttegro/react'

export function CheckoutPage({ orderId }: { orderId: string }) {
  return (
    <Checkout
      orderId={orderId}
      onCompleted={() => window.location.assign('/orders/complete')}
    />
  )
}
```

The Vue, Svelte, and Angular packages expose the same workflow using native
component and event conventions. See each package README and the examples.

## Security boundary

- Never pass an Inttegro secret API key to these packages.
- `@inttegro/js` never bundles or exports the executable checkout runtime. It
  loads the exact versioned URL controlled by Inttegro, and that URL cannot be
  overridden.
- Do not copy, mirror, bundle, proxy, cache into a service worker, or self-host
  `inttegro.js`. Loading it from Inttegro's origin keeps payment-collection code
  under Inttegro's release and incident-response controls.
- Treat the Order reference as a payment capability and avoid analytics,
  exception, or DOM logging that records it.
- The SDK accepts messages only from the fixed Inttegro Pages origin and the
  exact iframe it mounted.
- A restrictive host Content Security Policy must allow at least
  `script-src https://js.inttegro.com` and
  `frame-src https://pages.inttegro.com`. Pass the request nonce to
  `loadInttegro({ nonce })` when the policy uses nonces.
- The SDK isolates payment fields, but that is not by itself evidence of any
  merchant or Inttegro compliance certification. This boundary is deliberate
  even before card data or a formal PCI scope applies.

The runtime source, build pipeline, and edge/CDN configuration live in private
Inttegro infrastructure and are intentionally absent from this repository. An
npm release is blocked unless a compatible runtime is already live at the fixed
Inttegro URL.

## Development

Requires Node.js 24.15 or newer.

```bash
npm install
npm run check
```

All packages begin at `0.1.0` and are released together while the cross-package
contract is stabilizing.

# Inttegro JavaScript SDKs

Embed Inttegro Checkout in a website or web application. Use `@inttegro/js`
directly, or choose the adapter for your frontend framework.

| Package             | Use it with                   |
| ------------------- | ----------------------------- |
| `@inttegro/js`      | Browser JavaScript/TypeScript |
| `@inttegro/react`   | React                         |
| `@inttegro/vue`     | Vue                           |
| `@inttegro/svelte`  | Svelte                        |
| `@inttegro/angular` | Angular                       |

The packages load the sensitive checkout runtime from Inttegro-controlled
servers. They do not include a copy of that runtime, so payment collection
always uses the current Inttegro-hosted experience.

## Before you begin

Create and finalize an Order on your server using an Inttegro server SDK. Send
only its client-safe Order ID to your web application. Never expose an Inttegro
secret API key in browser code.

## Install

Install `@inttegro/js` for a plain JavaScript or TypeScript application. For a
framework application, install the matching adapter instead; it includes
`@inttegro/js` as a dependency.

### npm

```bash
# JavaScript or TypeScript
npm install @inttegro/js

# Choose one framework adapter
npm install @inttegro/react
npm install @inttegro/vue
npm install @inttegro/svelte
npm install @inttegro/angular
```

Import packages by name:

```ts
import { loadInttegro } from '@inttegro/js'
```

### Yarn

```bash
# JavaScript or TypeScript
yarn add @inttegro/js

# Choose one framework adapter
yarn add @inttegro/react
yarn add @inttegro/vue
yarn add @inttegro/svelte
yarn add @inttegro/angular
```

Import packages by name:

```ts
import { loadInttegro } from '@inttegro/js'
```

### Bun

```bash
# JavaScript or TypeScript
bun add @inttegro/js

# Choose one framework adapter
bun add @inttegro/react
bun add @inttegro/vue
bun add @inttegro/svelte
bun add @inttegro/angular
```

Import packages by name:

```ts
import { loadInttegro } from '@inttegro/js'
```

### Deno

Deno supports the packages through its npm compatibility layer:

```bash
# JavaScript or TypeScript
deno add npm:@inttegro/js

# Choose one framework adapter
deno add npm:@inttegro/react
deno add npm:@inttegro/vue
deno add npm:@inttegro/svelte
deno add npm:@inttegro/angular
```

Use an `npm:` specifier when importing without a package manifest:

```ts
import { loadInttegro } from 'npm:@inttegro/js'
```

## JavaScript and TypeScript

Load Inttegro, create Checkout for an Order, and mount it into an empty
container:

```html
<div id="checkout"></div>
```

```ts
import { loadInttegro } from '@inttegro/js'

const inttegro = await loadInttegro()

if (!inttegro) {
  throw new Error('Inttegro Checkout must be initialized in a browser')
}

const checkout = inttegro.createCheckout({
  orderId: 'YOUR_ORDER_ID',
  appearance: { theme: 'system' },
  features: {
    showLineItems: true,
    showInvoiceDownload: true,
    showReceiptDownload: true,
    allowPaymentMethodChange: false,
  },
  locale: 'en-GH',
})

checkout.on('completed', () => {
  window.location.assign('/orders/complete')
})

checkout.on('error', (event) => {
  console.error(event.error.message)
})

await checkout.mount('#checkout')
```

`loadInttegro()` returns `null` during server-side rendering. Initialize and
mount Checkout only in browser code.

To open the same Checkout in a responsive modal, call `present()` instead of
building a dialog and mounting into it:

```ts
checkout.on('canceled', () => {
  // The payer closed the modal before payment completed.
})

await checkout.present()
```

Inttegro owns the backdrop, close controls, viewport scrolling, focus handling,
and teardown. Call `checkout.dismiss()` when the application needs to close the
managed modal programmatically.

## Framework adapters

The official adapters map Checkout onto each framework's component lifecycle,
reactivity model, events, and cleanup conventions. Start with the adapter
overview, then follow the guide for your application:

- [Framework adapter overview](./docs/guides/framework-adapters.md)
- [React](./docs/guides/react.md)
- [Vue](./docs/guides/vue.md)
- [Svelte](./docs/guides/svelte.md)
- [Angular](./docs/guides/angular.md)
- [Inertia](./docs/guides/inertia.md)

Inertia uses the official adapter for its configured client framework; it does
not require a separate Inttegro package.

## Checkout options

All integrations accept these options:

| Option       | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| `appearance` | Sets the `light`, `dark`, or `system` theme.                 |
| `features`   | Controls line items, document downloads, and method changes. |
| `locale`     | Sets a BCP 47 locale preference, such as `en-GH`.            |
| `orderId`    | Identifies the finalized Order to collect payment for.       |
| `timeout`    | Sets how long Checkout waits to become ready.                |
| `title`      | Provides an accessible title for the hosted experience.      |

Hosted Checkout keeps its existing behavior when `features` is omitted: line
items are hidden, invoice and receipt actions are offered after successful
payment, and the payer may replace an attached payment method. A document
action is rendered only when Checkout returns that document's link.

The framework adapters also provide `completed`, `error`, `event`, and `ready`
callbacks or events using each framework's native conventions.

With `@inttegro/js`, subscribe to a single event with `checkout.on(type,
handler)`, or observe the full lifecycle with `checkout.onEvent(handler)`. Both
methods return an unsubscribe function.

## Content Security Policy

If your application uses Content Security Policy, allow Inttegro's script and
hosted checkout origins:

```text
script-src https://js.inttegro.com;
frame-src https://pages.inttegro.com;
```

When your script policy uses a nonce, pass it to the loader:

```ts
const inttegro = await loadInttegro({ nonce: requestNonce })
```

Keep the nonce private to the rendered page and generate a new value for every
response.

## Security

- Never include an Inttegro secret API key in browser code.
- Treat an Order ID as a payment capability. Do not record it in analytics,
  exception reports, or DOM logs.
- Do not download, copy, mirror, proxy, bundle, or self-host the Inttegro
  checkout runtime. Load it through these packages from Inttegro-controlled
  servers.
- Payment details are collected within the Inttegro-hosted experience and are
  not included in lifecycle events delivered to your application.

## Documentation

Read the [integration guides](https://studio.inttegro.com/web) in Inttegro
Studio and browse the [generated API reference](https://web.inttegro.dev/v0.3.0/)
for every JavaScript framework package.

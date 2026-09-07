---
title: Get started with Checkout
group: Guides
---

# Get started with Checkout

Inttegro Checkout collects payment for a finalized Order inside a hosted frame. Your server remains responsible for creating the Order and deciding when it is safe to fulfill; the browser receives only the client-safe Order ID and the hosted experience owns sensitive payer input.

This separation gives you a small integration surface:

1. Your server creates and finalizes an Order.
2. Your application sends the Order ID to the page that will collect payment.
3. The page loads Inttegro with {@linkcode @inttegro/js!loadInttegro:function | loadInttegro}, creates a {@linkcode @inttegro/js!CheckoutController:interface | CheckoutController}, and mounts it into an empty element.
4. Checkout reports presentation and payment lifecycle events to the host page.
5. Your server verifies the final Order state before fulfillment.

## Before you write browser code

Create the Order from a trusted server environment using your secret Inttegro credentials. Do not create Orders from a browser and never put a secret API key in a page, mobile application, repository, or framework environment variable that is exposed to the client.

The `orderId` passed to Checkout is intentionally safe to place in browser code. It identifies the commercial terms that your server already finalized. A payer can attempt to satisfy those terms, but Checkout does not let the browser change the amount, currency, merchant, items, or shipping destination.

Return the Order ID in the response that renders the payment page, for example:

```json
{
  "orderId": "ord_01J..."
}
```

## Install the browser package

Use the package manager already used by your application:

```bash
npm install @inttegro/js
# or: yarn add @inttegro/js
# or: bun add @inttegro/js
# or: deno add npm:@inttegro/js
```

The package contains the loader and TypeScript types. It does not contain the executable payment-collection runtime. {@linkcode @inttegro/js!loadInttegro:function | loadInttegro} always loads that runtime from Inttegro's fixed origin so every integration receives the maintained hosted experience.

## Mount Checkout

Give Checkout an empty, visible container. Your application controls the container's width and placement; Checkout controls everything inside it.

```html
<main>
  <h1>Complete your order</h1>
  <div id="checkout"></div>
</main>
```

```css
#checkout {
  inline-size: 100%;
  max-inline-size: 34rem;
  min-block-size: 32rem;
}
```

Load the runtime, create the controller, subscribe to events, and then mount it:

```ts
import {
  InttegroCheckoutError,
  loadInttegro,
  type CheckoutEvent,
} from '@inttegro/js'

const target = document.querySelector<HTMLElement>('#checkout')
if (!target) throw new Error('Checkout container is missing')

try {
  const inttegro = await loadInttegro()

  // loadInttegro returns null during server-side rendering.
  if (!inttegro) return

  const checkout = inttegro.createCheckout({
    orderId: window.checkoutOrderId,
    appearance: { theme: 'system' },
    locale: 'en-GH',
    title: 'Payment for your order',
  })

  const unsubscribe = checkout.onEvent((event: CheckoutEvent) => {
    sendCheckoutTelemetry(event)

    if (event.type === 'completed') {
      window.location.assign('/orders/complete')
    }
  })

  await checkout.mount(target)

  // Keep these references and call both when the page is permanently removed.
  window.addEventListener(
    'pagehide',
    () => {
      unsubscribe()
      checkout.destroy()
    },
    { once: true },
  )
} catch (error) {
  if (error instanceof InttegroCheckoutError) {
    showCheckoutUnavailable(error.code)
  } else {
    throw error
  }
}
```

Register event handlers before {@linkcode @inttegro/js!CheckoutController#mount | CheckoutController.mount} so you also observe early lifecycle events such as `ready`. The mount promise resolves only when the hosted experience is interactive.

## Choose a theme and locale

Use `system` unless your checkout surface deliberately has a fixed theme. It follows the payer's browser preference and responds when that preference changes.

```ts
const checkout = inttegro.createCheckout({
  orderId,
  appearance: { theme: 'system' },
  locale: 'en-GH',
})
```

You can change presentation settings without replacing Checkout or discarding payer progress:

```ts
checkout.update({
  appearance: { theme: 'dark' },
  locale: 'fr-FR',
})
```

Changing `orderId`, `timeout`, or `title` requires a new controller. Framework adapters handle that replacement automatically.

## Handle completion safely

The browser's `completed` event is useful for navigation, confirmation messaging, and telemetry. It is not a fulfillment credential. Browser events can be interrupted, suppressed, or replayed.

After completion, retrieve the Order from your server and confirm its payable
balance and final status. Keep fulfillment idempotent so repeated status checks
cannot ship, credit, or notify twice.

If the payer closes the page after authorizing a payment but before the browser receives `completed`, server-side reconciliation still gives you the correct outcome.

## Clean up the controller

Use {@linkcode @inttegro/js!CheckoutController#unmount | CheckoutController.unmount} when a view is temporarily removed and the same controller will be mounted again. It retains subscriptions. Use {@linkcode @inttegro/js!CheckoutController#destroy | CheckoutController.destroy} when the flow or route is permanently finished. Destruction removes the frame and every event subscription and is safe to call more than once.

Framework adapters perform this cleanup during their normal unmount lifecycle. Keep the component mounted while a payment or provider confirmation is pending.

## Next steps

- Read [Framework adapters](./framework-adapters.md) for React, Vue, Svelte, Angular, and Inertia examples.
- Read [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md) before connecting fulfillment or analytics.
- Read [Security, CSP, and accessibility](./security-csp-and-accessibility.md) before deploying Checkout.
- Explore the API reference for exact options, event payloads, error codes, and controller methods. Every API declaration includes a permanent link to its source on GitHub.

---
title: Inertia
group: Framework adapters
---

# Integrate Checkout with Inertia

Inertia connects server-defined routes and controllers to React, Vue, or Svelte page components without requiring a separate client API layer. It does not replace the client framework's component lifecycle, so there is deliberately no `@inttegro/inertia` package. Use the official Inttegro adapter for the framework that renders your Inertia pages.

That composition is the strongest integration: your server creates the finalized Order and returns its client-safe ID as a page prop; Inertia delivers the prop; the React, Vue, or Svelte adapter owns hosted Checkout until the page is replaced. A dedicated Inertia wrapper would only add another abstraction while obscuring which component lifecycle actually controls payment collection.

## Install the matching adapter

Add one Inttegro package next to your existing Inertia client adapter:

```bash
# React
npm install @inttegro/react

# Vue 3
npm install @inttegro/vue

# Svelte 5
npm install @inttegro/svelte
```

Use the equivalent command for Yarn, Bun, or Deno if that tool owns your application dependencies. Each Inttegro adapter includes `@inttegro/js`, but not the executable payment runtime. The browser loader obtains that runtime from Inttegro's fixed origin when the page component mounts.

## Return a payment page from your server

Create and finalize the Order with secret credentials on your server. Then render the Inertia page with only values that are safe to serialize into the page response. For example, a Laravel controller can return:

```php
use Illuminate\Support\Str;
use Inertia\Inertia;

return Inertia::render('Orders/Pay', [
    'orderId' => $order->inttegro_order_id,
    'pageSessionId' => (string) Str::uuid(),
]);
```

The Order ID identifies terms your server has already finalized. Do not include an Inttegro secret key, payment method, account number, contact details, or provider response in Inertia props. Those props may appear in initial HTML, browser history state, diagnostics, and client-side page objects.

## React page

Use `@inttegro/react` inside the Inertia page and perform the completion visit only after the hosted success event:

```tsx
import { router } from '@inertiajs/react'
import {
  Checkout,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/react'

interface PayProps {
  orderId: string
  pageSessionId: string
}

export default function Pay({ orderId, pageSessionId }: PayProps) {
  function sendTelemetry(payload: Record<string, unknown>) {
    navigator.sendBeacon(
      '/telemetry/checkout',
      new Blob([JSON.stringify({ ...payload, pageSessionId })], {
        type: 'application/json',
      }),
    )
  }

  function recordEvent(event: CheckoutEvent) {
    sendTelemetry({ type: event.type, occurredAt: event.occurredAt })
  }

  function handleError(failure: CheckoutErrorEvent | Error) {
    if (failure instanceof Error) {
      sendTelemetry({
        type: 'initializationFailed',
        message: failure.message,
      })
    }
    // Hosted errors already pass through recordEvent.
  }

  return (
    <Checkout
      orderId={orderId}
      appearance={{ theme: 'system' }}
      title="Payment for your order"
      style={{ minBlockSize: '32rem' }}
      onEvent={recordEvent}
      onCompleted={() => router.visit('/orders/complete')}
      onError={handleError}
    />
  )
}
```

Read the [React adapter guide](./react.md) for effect cleanup, Strict Mode, refs, and hydration behavior.

## Vue page

Vue pages receive the same server props and use native emitted events:

```vue
<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import {
  Checkout,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/vue'

const props = defineProps<{ orderId: string; pageSessionId: string }>()

function recordEvent(event: CheckoutEvent) {
  navigator.sendBeacon(
    '/telemetry/checkout',
    new Blob(
      [
        JSON.stringify({
          type: event.type,
          occurredAt: event.occurredAt,
          pageSessionId: props.pageSessionId,
        }),
      ],
      { type: 'application/json' },
    ),
  )
}

function handleError(failure: CheckoutErrorEvent | Error) {
  if (failure instanceof Error) {
    navigator.sendBeacon(
      '/telemetry/checkout',
      new Blob(
        [
          JSON.stringify({
            type: 'initializationFailed',
            message: failure.message,
            pageSessionId: props.pageSessionId,
          }),
        ],
        { type: 'application/json' },
      ),
    )
  }
  // Hosted errors already pass through recordEvent.
}
</script>

<template>
  <Checkout
    :order-id="props.orderId"
    :appearance="{ theme: 'system' }"
    title="Payment for your order"
    style="min-block-size: 32rem"
    @event="recordEvent"
    @completed="router.visit('/orders/complete')"
    @error="handleError"
  />
</template>
```

Read the [Vue adapter guide](./vue.md) for watchers, template refs, emitted events, and Vue SSR behavior.

## Svelte page

Svelte pages use callback props and the Inertia Svelte router:

```svelte
<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import {
    Checkout,
    type CheckoutErrorEvent,
    type CheckoutEvent,
  } from '@inttegro/svelte'

  let { orderId, pageSessionId }: { orderId: string; pageSessionId: string } =
    $props()

  function recordEvent(event: CheckoutEvent) {
    navigator.sendBeacon(
      '/telemetry/checkout',
      new Blob(
        [
          JSON.stringify({
            type: event.type,
            occurredAt: event.occurredAt,
            pageSessionId,
          }),
        ],
        { type: 'application/json' },
      ),
    )
  }

  function handleError(failure: CheckoutErrorEvent | Error) {
    if (failure instanceof Error) {
      navigator.sendBeacon(
        '/telemetry/checkout',
        new Blob(
          [
            JSON.stringify({
              type: 'initializationFailed',
              message: failure.message,
              pageSessionId,
            }),
          ],
          { type: 'application/json' },
        ),
      )
    }
    // Hosted errors already pass through recordEvent.
  }
</script>

<Checkout
  {orderId}
  class="checkout"
  appearance={{ theme: 'system' }}
  title="Payment for your order"
  onEvent={recordEvent}
  onCompleted={() => router.visit('/orders/complete')}
  onError={handleError}
/>
```

Read the [Svelte adapter guide](./svelte.md) for rune dependencies, effect cleanup, styling, and SvelteKit SSR behavior.

## Visits, remounting, and payment state

An Inertia visit that removes the payment page also removes the adapter component. The adapter then unsubscribes and destroys its Checkout controller. If an asynchronous runtime load finishes after the visit, its stale-work guard prevents it from mounting into the abandoned page.

On a visit that keeps the page component but supplies a different `orderId`, the framework adapter intentionally destroys the old controller and creates a new hosted experience. Changes limited to `appearance` or `locale` update the active experience in place.

Do not initiate automatic visits while Checkout reports `paymentAttempt` or `confirmationRequired`. Keep the component visible so the payer can see provider progress and finish any required step. If the payer deliberately navigates away, treat the browser experience as interrupted—not necessarily failed. The server-side attempt may still complete.

The `/orders/complete` route in the examples must retrieve authoritative Order state using server credentials. If payment is still pending, render a pending state and continue reconciliation. Never fulfill solely because `router.visit()` followed a `completed` callback.

## SSR, errors, and the direct-loader exception

Inertia SSR does not require special Inttegro code. The selected framework adapter renders an empty host container on the server and loads the hosted runtime only in the browser lifecycle. The Inertia page prop is therefore sufficient for both initial hydration and later client-side visits.

Forward the adapter's generic event hook to telemetry so events such as `confirmationRequired`, `paymentAttemptFailed`, and `canceled` are not lost during the handoff between hosted Checkout and the Inertia page. Treat a JavaScript `Error` as an initialization failure and a `CheckoutErrorEvent` as a sanitized hosted error. Checkout owns payment-specific recovery messages.

Use `@inttegro/js` directly only when you need controller ownership outside the React, Vue, or Svelte page tree, or when a strict Content Security Policy requires passing a per-response nonce to `loadInttegro()`. Inertia itself does not change that boundary.

## Related resources

- [Framework adapter overview](./framework-adapters.md)
- [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md)
- [Security, CSP, and accessibility](./security-csp-and-accessibility.md)
- [Inertia client-side setup](https://inertiajs.com/docs/v3/installation/client-side-setup)
- [Inertia manual visits](https://inertiajs.com/docs/v3/the-basics/manual-visits)

---
title: Framework adapters
group: Guides
---

# Framework adapters

The React, Vue, Svelte, and Angular packages own the same lifecycle that you would otherwise manage with {@linkcode @inttegro/js!loadInttegro:function | loadInttegro} and {@linkcode @inttegro/js!CheckoutController:interface | CheckoutController}: load the hosted runtime in the browser, create a controller, mount it, forward sanitized events, update presentation props, and destroy the controller when the view leaves the page.

Install only the adapter for your application. Each adapter already depends on `@inttegro/js`.

```bash
npm install @inttegro/react
# or: npm install @inttegro/vue
# or: npm install @inttegro/svelte
# or: npm install @inttegro/angular
```

All adapters share the same behavioral contract:

| Input changes                    | Behavior                                               |
| -------------------------------- | ------------------------------------------------------ |
| `appearance` or `locale`         | Updates the active hosted experience in place.         |
| `orderId`, `timeout`, or `title` | Destroys the current controller and creates a new one. |
| Component unmount                | Unsubscribes from events and destroys the controller.  |

Keep the component mounted during payment submission and external confirmation. Replacing or removing it at that point can hide useful progress from the payer even though the server-side attempt may continue.

## React

The React `Checkout` component supports server rendering because it loads the runtime only inside a browser effect. Use `onEvent` for complete telemetry, `onCompleted` for navigation, and `onError` for loader, mount, and sanitized hosted errors.

```tsx
import { useRef } from 'react'
import {
  Checkout,
  type CheckoutHandle,
  type CheckoutProps,
} from '@inttegro/react'

export function PaymentPage({ orderId }: { orderId: string }) {
  const checkout = useRef<CheckoutHandle>(null)

  const handleError: CheckoutProps['onError'] = (error) => {
    reportCheckoutError(error)
  }

  return (
    <section aria-labelledby="payment-heading">
      <h1 id="payment-heading">Complete your order</h1>
      <Checkout
        ref={checkout}
        orderId={orderId}
        appearance={{ theme: 'system' }}
        locale="en-GH"
        title="Payment for your order"
        style={{ minHeight: '32rem' }}
        onReady={() => checkout.current?.focus()}
        onEvent={sendCheckoutTelemetry}
        onCompleted={() => window.location.assign('/orders/complete')}
        onError={handleError}
      />
    </section>
  )
}
```

The forwarded `CheckoutHandle` exposes `focus()` and `update()`. Prefer props for ordinary React state. The handle is most useful after opening a dialog, where moving focus into the hosted experience is an explicit interaction requirement.

Changing callback function identity does not remount Checkout. Changing the Order ID does.

## Vue

The Vue `Checkout` component emits `ready`, `event`, `completed`, and `error`. A template ref exposes `focus()` and `update()`.

```vue
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Checkout, type CheckoutExposed } from '@inttegro/vue'

const props = defineProps<{ orderId: string }>()
const checkout = ref<CheckoutExposed>()

async function handleReady() {
  await nextTick()
  checkout.value?.focus()
}

function handleCompleted() {
  window.location.assign('/orders/complete')
}
</script>

<template>
  <section aria-labelledby="payment-heading">
    <h1 id="payment-heading">Complete your order</h1>
    <Checkout
      ref="checkout"
      :order-id="props.orderId"
      :appearance="{ theme: 'system' }"
      locale="en-GH"
      title="Payment for your order"
      style="min-height: 32rem"
      @ready="handleReady"
      @event="sendCheckoutTelemetry"
      @completed="handleCompleted"
      @error="reportCheckoutError"
    />
  </section>
</template>
```

The component watches `appearance` deeply, so replacing or updating the theme object applies it to the existing controller.

## Svelte

The Svelte component accepts callback props rather than dispatching component events. Its root container forwards the optional `class` prop for host-page layout.

```svelte
<script lang="ts">
  import { Checkout } from '@inttegro/svelte'
  import type { CheckoutEvent } from '@inttegro/svelte'

  let { orderId }: { orderId: string } = $props()

  function handleEvent(event: CheckoutEvent) {
    sendCheckoutTelemetry(event)
  }
</script>

<section aria-labelledby="payment-heading">
  <h1 id="payment-heading">Complete your order</h1>
  <Checkout
    {orderId}
    class="checkout-container"
    appearance={{ theme: 'system' }}
    locale="en-GH"
    title="Payment for your order"
    onEvent={handleEvent}
    onCompleted={() => location.assign('/orders/complete')}
    onError={reportCheckoutError}
  />
</section>

<style>
  :global(.checkout-container) {
    min-height: 32rem;
  }
</style>
```

Reactive changes to `appearance` and `locale` update the active controller. Changes to identity options replace it.

## Angular

`CheckoutComponent` is standalone. Import it directly into the component that owns the payment route or dialog.

```ts
import { Component, input, viewChild } from '@angular/core'
import {
  CheckoutComponent,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/angular'

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CheckoutComponent],
  template: `
    <section aria-labelledby="payment-heading">
      <h1 id="payment-heading">Complete your order</h1>
      <inttegro-checkout
        #checkout
        [orderId]="orderId()"
        [appearance]="{ theme: 'system' }"
        locale="en-GH"
        title="Payment for your order"
        style="display: block; min-height: 32rem"
        (ready)="checkout.focus()"
        (event)="handleEvent($event)"
        (completed)="handleCompleted()"
        (error)="handleError($event)"
      />
    </section>
  `,
})
export class PaymentPageComponent {
  readonly orderId = input.required<string>()
  readonly checkout = viewChild.required(CheckoutComponent)

  handleEvent(event: CheckoutEvent): void {
    sendCheckoutTelemetry(event)
  }

  handleCompleted(): void {
    location.assign('/orders/complete')
  }

  handleError(error: CheckoutErrorEvent | Error): void {
    reportCheckoutError(error)
  }
}
```

The outputs follow Angular conventions, and public `focus()` and `update()` methods cover imperative host integrations.

## Inertia

Inertia does not need a separate Inttegro package. Use the adapter that matches the client framework in your Inertia application: React, Vue, or Svelte. Return the finalized Order ID as a page prop from the server, then pass it to the adapter.

For example, a Laravel controller can render a Vue payment page with a client-safe Order ID:

```php
return Inertia::render('Orders/Pay', [
    'orderId' => $order->inttegro_order_id,
]);
```

The Vue page receives the prop without receiving an Inttegro secret:

```vue
<script setup lang="ts">
import { Checkout } from '@inttegro/vue'
defineProps<{ orderId: string }>()
</script>

<template>
  <Checkout
    :order-id="orderId"
    :appearance="{ theme: 'system' }"
    @completed="router.visit('/orders/complete')"
  />
</template>
```

If an Inertia visit would unmount the Checkout page, do not trigger it while payment or confirmation is pending. Wait for a terminal event or an explicit payer action.

## Content Security Policy nonces

The core {@linkcode @inttegro/js!loadInttegro:function | loadInttegro} function accepts a per-response CSP nonce. Framework adapters currently manage loading internally and do not expose loader options. If your policy requires a nonce on every script element, use `@inttegro/js` directly until the adapter you use exposes loader configuration. Do not hard-code, persist, or reuse a nonce.

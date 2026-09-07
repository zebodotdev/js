---
title: Vue
group: Framework adapters
---

# Integrate Checkout with Vue

Vue combines declarative templates with reactive props, lifecycle hooks, and explicit component events. `@inttegro/vue` presents Inttegro Checkout in those terms: reactive presentation props update the hosted experience, identity props replace it, and lifecycle events are emitted through Vue's normal `@event` syntax.

Use the official adapter for Vue 3.4 or later. It keeps the imperative hosted controller behind a declarative component, cancels stale asynchronous mounts during rapid navigation, and exposes only the two imperative operations that are useful to a parent component. That is safer and easier to review than duplicating loader, watcher, subscription, and teardown code in every payment view.

## Install the adapter

Use your application's existing package manager. With npm:

```bash
npm install @inttegro/vue
```

`@inttegro/vue` depends on `@inttegro/js`, whose loader downloads the executable runtime from Inttegro's fixed origin. Neither package contains a copy of the sensitive payment-collection runtime.

Create and finalize the Order on your server, then pass only its client-safe Order ID to the Vue page. Secret Inttegro credentials must never enter `defineProps`, Nuxt payload state, or browser environment variables.

## Render a payment view

This Vue component forwards the complete event stream to application telemetry, routes after completion, and renders a fallback only when Checkout itself could not initialize:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Checkout,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/vue'

const props = defineProps<{
  orderId: string
  pageSessionId: string
}>()

const router = useRouter()
const initializationFailed = ref(false)

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
    initializationFailed.value = true
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
  // Hosted errors already pass through recordEvent. Checkout owns their copy.
}

function handleCompleted() {
  void router.push('/orders/complete')
}
</script>

<template>
  <main>
    <h1>Complete your order</h1>
    <p v-if="initializationFailed" role="alert">
      Checkout could not load. Refresh the page to try again.
    </p>
    <Checkout
      v-else
      :order-id="props.orderId"
      :appearance="{ theme: 'system' }"
      locale="en-GH"
      title="Payment for your order"
      style="inline-size: 100%; min-block-size: 32rem"
      @event="recordEvent"
      @completed="handleCompleted"
      @error="handleError"
    />
  </main>
</template>
```

The completion route must reconcile the Order from your server before fulfillment. Vue navigation follows the browser event; it does not turn that event into server-authoritative payment state.

## How Vue reactivity maps to Checkout

The adapter uses Vue primitives intentionally:

- `onMounted` starts browser runtime loading and mounts the controller into the component's `div`.
- A watcher on `appearance` and `locale` calls `update()` on the active controller. The watcher is deep, so a nested theme change is observed.
- A watcher on `orderId`, `timeout`, and `title` destroys the controller and starts a new mount because those values identify a hosted experience.
- `onBeforeUnmount` unsubscribes from events and destroys the controller.
- A generation counter invalidates an older asynchronous load when props change or the view unmounts before loading completes.

This makes the component predictable inside `v-if`, `<RouterView>`, dialogs, and transitions: the Vue view that renders Checkout owns exactly one current controller. Keep that view mounted while payment submission or provider confirmation is pending. Removing it destroys the frame even if the server-side attempt continues.

The component uses Vue emits rather than DOM custom events. It emits `event`, `ready`, `completed`, and `error`. A template ref exposes the {@linkcode @inttegro/vue!CheckoutExposed:interface | CheckoutExposed} interface for focus and presentation updates:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Checkout, type CheckoutExposed } from '@inttegro/vue'

const checkout = ref<CheckoutExposed>()
</script>

<template>
  <Checkout ref="checkout" :order-id="orderId" @ready="checkout?.focus()" />
</template>
```

Prefer reactive props for ordinary application state. Use `focus()` after a payment dialog opens, or `update()` when an imperative host integration cannot express locale or theme as props.

## Events and errors

The `event` emission receives every sanitized {@linkcode @inttegro/vue!CheckoutEvent:type | CheckoutEvent}. It is the reliable integration point for telemetry and for lifecycle states without a dedicated emission, such as `confirmationRequired`, `paymentAttemptFailed`, and `canceled`.

The `error` emission receives either a JavaScript `Error` from runtime loading or mounting, or a {@linkcode @inttegro/vue!CheckoutErrorEvent:interface | CheckoutErrorEvent} from hosted Checkout. Test `failure instanceof Error` before choosing the surrounding-page response. Do not replace Checkout merely because a hosted error is recoverable; the frame owns its retry and correction UI.

## Server rendering and hydration

The adapter renders only its empty container during server rendering. Runtime loading starts in `onMounted`, after the component is in the browser, so Nuxt and other Vue SSR applications can render and hydrate the same initial structure.

Pass the Order ID through server-owned page data, but do not render secret credentials into the hydration payload. If route data changes to another Order ID, expect a fresh Checkout by design. A locale or theme change updates the current one instead.

The current adapter does not expose `loadInttegro()` options. If a strict Content Security Policy requires a per-response nonce on the runtime script, integrate with `@inttegro/js` directly. For normal Vue-owned routes and dialogs, the official adapter remains the preferred lifecycle boundary.

## Related resources

- [Framework adapter overview](./framework-adapters.md)
- [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md)
- [Security, CSP, and accessibility](./security-csp-and-accessibility.md)
- {@linkcode @inttegro/vue!CheckoutProps:interface | Vue Checkout props}

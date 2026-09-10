---
title: Svelte
group: Framework adapters
---

# Integrate Checkout with Svelte

Svelte 5 expresses reactive work with runes and gives each effect an explicit cleanup boundary. `@inttegro/svelte` uses those primitives to make an imperative hosted Checkout behave like a normal Svelte component: identity changes replace the controller, presentation changes update it, and effect cleanup permanently releases it.

Prefer the official adapter when Checkout lives in a Svelte or SvelteKit component. Its effects are structured to avoid accidentally rebuilding the payment experience when only a callback, locale, or theme changes, and it prevents a late runtime promise from mounting after navigation. Reimplementing those dependency boundaries directly with `@inttegro/js` is possible, but adds payment-specific lifecycle code to every route that hosts Checkout.

## Install the adapter

Use your application's package manager. With npm:

```bash
npm install @inttegro/svelte
```

The adapter supports Svelte 5 and depends on `@inttegro/js`. The installed packages provide the component, loader, and public TypeScript types. The executable payment-collection runtime is still downloaded from Inttegro's fixed origin when the component runs in a browser.

Create and finalize the Order on your server. Send only the client-safe Order ID to the Svelte page; do not expose Inttegro secret credentials in `load` data, public environment variables, or serialized page state.

## Render a SvelteKit payment page

This page component records the sanitized event stream, handles initialization failure separately from hosted errors, and navigates after the hosted success state:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    Checkout,
    type CheckoutErrorEvent,
    type CheckoutEvent,
  } from '@inttegro/svelte'

  let { orderId, pageSessionId }: { orderId: string; pageSessionId: string } =
    $props()

  let initializationFailed = $state(false)

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
      initializationFailed = true
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
    // Hosted errors already pass through recordEvent. Checkout owns their copy.
  }
</script>

<svelte:head>
  <title>Complete your order</title>
</svelte:head>

<main>
  <h1>Complete your order</h1>
  {#if initializationFailed}
    <p role="alert">Checkout could not load. Refresh the page to try again.</p>
  {:else}
    <Checkout
      {orderId}
      class="checkout"
      appearance={{ theme: 'system' }}
      locale="en-GH"
      title="Payment for your order"
      onEvent={recordEvent}
      onCompleted={() => void goto('/orders/complete')}
      onError={handleError}
    />
  {/if}
</main>

<style>
  :global(.checkout) {
    inline-size: 100%;
    min-block-size: 32rem;
  }
</style>
```

The completion page must ask your server for the current Order state before
fulfillment. Client navigation is a response to the browser event, not
independent proof of payment.

## How Svelte reactivity maps to Checkout

The adapter separates controller identity from presentation with two effects:

- The controller effect tracks `features`, `orderId`, `presentation`, `timeout`, and `title`. Changing one runs cleanup, destroys the old controller, and creates a new embedded or modal experience.
- The same effect reads initial `appearance` and `locale` with `untrack`, so changing either value does not accidentally replace the controller.
- A second effect tracks `appearance`, `locale`, and the active controller, applying presentation changes through `update()`.
- The controller effect returns cleanup that marks asynchronous work inactive, unsubscribes from events, and destroys the instance.

That split is especially useful during SvelteKit navigation. When a page component leaves the route, cleanup owns the frame immediately. If the shared runtime finishes loading later, the inactive effect refuses to create a controller. Keep the component present while payment or confirmation is pending; an `{#if}` branch that removes it deliberately ends the browser experience.

The optional `class` prop is applied to the host `div`, which lets your component own width, height, and surrounding layout without reaching into the hosted frame. Set `presentation="modal"` when Checkout should open above the page; Inttegro then supplies the dialog, backdrop, viewport scrolling, close control, and focus behavior. A bound component instance exposes `dismiss()`, `focus()`, and `update()`, although props remain the preferred update path.

```svelte
<button onclick={() => (open = true)}>Pay now</button>
{#if open}
  <Checkout {orderId} presentation="modal" onCanceled={() => (open = false)} />
{/if}
```

## Events and errors

Svelte 5 callback props are used instead of dispatched component events:

- `onEvent` receives every sanitized {@linkcode @inttegro/svelte!CheckoutEvent:type | CheckoutEvent};
- `onReady` receives the interactive `ready` event;
- `onCompleted` receives the successful hosted terminal event;
- `onCanceled` receives a managed-modal dismissal before completion; and
- `onError` receives loader and mount errors as well as hosted error events.

Use `onEvent` for telemetry and for `paymentAttempt`, `confirmationRequired`, and `paymentAttemptFailed`. Keep telemetry sparse: event type, occurrence time, and an application-owned opaque page correlation value are usually enough.

The `onError` argument is either an `Error` from initialization or a {@linkcode @inttegro/svelte!CheckoutErrorEvent:interface | CheckoutErrorEvent} from inside hosted Checkout. Show an application fallback only for the first case. Hosted Checkout already knows whether an operational error is recoverable and owns the payment-specific message.

## Server rendering and hydration

Svelte effects do not run during server rendering. The server and initial client render contain the same empty host `div`; runtime loading and frame creation begin in the browser after hydration. This makes the component suitable for a SvelteKit page without disabling SSR for the whole route.

Return the finalized Order ID from a server `load` function or an authenticated application endpoint, but keep Inttegro secret keys server-only. If the route reuses the component with a different Order ID, the adapter starts a new Checkout intentionally.

The adapter does not currently accept `loadInttegro()` options. Sites whose Content Security Policy requires a per-response script or managed-modal style nonce should use `@inttegro/js` directly. Otherwise, the Svelte component is the preferred owner of the hosted lifecycle.

## Related resources

- [Framework adapter overview](./framework-adapters.md)
- [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md)
- [Security, CSP, and accessibility](./security-csp-and-accessibility.md)
- {@linkcode @inttegro/svelte!CheckoutProps:interface | Svelte Checkout props}

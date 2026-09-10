---
title: React
group: Framework adapters
---

# Integrate Checkout with React

React describes UI as a function of props and state, then uses effects to synchronize with systems outside the component tree. `@inttegro/react` follows that model: its {@linkcode @inttegro/react!Checkout:variable | Checkout component} loads the Inttegro-hosted payment experience in an effect, then either mounts it into the component's container or asks the shared runtime to present its managed modal.

Use the official adapter for React 18 or later. It keeps controller ownership aligned with the component tree, survives development lifecycle probes without leaving a stale Checkout behind, and delivers events through ordinary callback props. You avoid recreating a subtle integration layer every time a route or dialog needs to collect payment.

## Install the adapter

Use the package manager already used by your React application. For npm:

```bash
npm install @inttegro/react
```

The package includes `@inttegro/js` as a dependency. It does not bundle the executable payment runtime. On the first browser mount, the shared loader downloads that runtime from Inttegro's fixed origin and the component creates the hosted frame for your finalized Order.

Your server should pass a client-safe Order ID to the React route. Never expose a secret Inttegro API key through props, serialized server state, or a public environment variable.

## Render a payment route

The following component records sanitized lifecycle events, distinguishes initialization failures from hosted errors, and navigates only after Checkout reports completion:

```tsx
import { useCallback, useState } from 'react'
import {
  Checkout,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/react'

interface PaymentPageProps {
  orderId: string
  pageSessionId: string
}

export function PaymentPage({ orderId, pageSessionId }: PaymentPageProps) {
  const [initializationFailed, setInitializationFailed] = useState(false)

  const recordEvent = useCallback(
    (event: CheckoutEvent) => {
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
    },
    [pageSessionId],
  )

  const handleError = useCallback(
    (failure: CheckoutErrorEvent | Error) => {
      if (failure instanceof Error) {
        setInitializationFailed(true)
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
    },
    [pageSessionId],
  )

  if (initializationFailed) {
    return (
      <p role="alert">
        Checkout could not load. Refresh the page to try again.
      </p>
    )
  }

  return (
    <main>
      <h1>Complete your order</h1>
      <Checkout
        orderId={orderId}
        appearance={{ theme: 'system' }}
        locale="en-GH"
        title="Payment for your order"
        style={{ inlineSize: '100%', minBlockSize: '32rem' }}
        onEvent={recordEvent}
        onCompleted={() => window.location.assign('/orders/complete')}
        onError={handleError}
      />
    </main>
  )
}
```

The completion destination must retrieve the Order from your server and verify
its current state before fulfilling it. A browser callback is useful for
navigation and telemetry, but is not proof that funds moved.

## How React state maps to Checkout

The adapter deliberately separates identity from presentation:

- `orderId`, `presentation`, `timeout`, and `title` are effect dependencies that identify one hosted experience. Changing one runs cleanup, destroys the current controller, and starts a new one.
- `appearance` and `locale` run through a separate update effect. They call the existing controller's `update()` method and preserve payer progress where the hosted flow permits.
- Callback props are read through a ref. A newly created callback function does not remount Checkout or resubscribe to the hosted event stream.
- Effect cleanup unsubscribes from events and destroys the controller. An `active` guard discards a runtime load that completes after React has already removed the component.

These rules also make React Strict Mode's development effect setup-and-cleanup cycle safe: only the currently active effect may create and own the controller. You should still keep the component mounted while a payment attempt or external confirmation is pending. Conditional rendering and route changes intentionally destroy the experience.

Set `presentation="modal"` when Checkout should open above the current page. Render the component only while application state considers payment open; Inttegro owns the actual dialog, backdrop, responsive sizing, scrolling, close control, and focus behavior:

```tsx
const [open, setOpen] = useState(false)

<button onClick={() => setOpen(true)}>Pay now</button>
{open ? (
  <Checkout
    orderId={orderId}
    presentation="modal"
    onCanceled={() => setOpen(false)}
    onCompleted={() => location.assign('/orders/complete')}
  />
) : null}
```

The forwarded {@linkcode @inttegro/react!CheckoutHandle:interface | CheckoutHandle} exposes `dismiss()`, `focus()`, and `update()`. Prefer props for ordinary state changes. Use `dismiss()` when host state must close managed modal Checkout programmatically.

## Events and errors

`onEvent` receives every sanitized {@linkcode @inttegro/react!CheckoutEvent:type | CheckoutEvent}. Use it for complete telemetry and for states without dedicated callback props, including `paymentAttempt`, `confirmationRequired`, and `paymentAttemptFailed`. `onReady`, `onCompleted`, and `onCanceled` are convenient filtered callbacks for their corresponding events.

`onError` receives one of two shapes:

- an `Error` when the loader, configuration, or mount operation fails; or
- a {@linkcode @inttegro/react!CheckoutErrorEvent:interface | CheckoutErrorEvent} when the hosted experience reports a sanitized operational error.

Show a host-page fallback for an initialization error because no usable Checkout is present. For a hosted error, record only the sanitized fields and let Checkout present the relevant correction or retry instructions. Do not log iframe messages, DOM content, account details, or provider responses.

## Server rendering and hydration

The component's initial output is an empty `div` on both server and client. It calls the browser-only loader inside an effect, after hydration, so the hosted frame is never rendered on the server.

In an environment that distinguishes server and client components, such as the Next.js App Router, place `Checkout` behind a client component boundary because it uses React hooks:

```tsx
'use client'

export { PaymentPage } from './PaymentPage'
```

Do not read the Order ID from an Inttegro secret in that client component. Fetch or serialize only the client-safe finalized Order ID from your server.

If your Content Security Policy requires a per-response script nonce, the adapter cannot currently pass loader options. Use `@inttegro/js` directly for that integration. Otherwise, the official React adapter is the preferred lifecycle owner.

## Related resources

- [Framework adapter overview](./framework-adapters.md)
- [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md)
- [Security, CSP, and accessibility](./security-csp-and-accessibility.md)
- {@linkcode @inttegro/react!CheckoutProps:interface | React Checkout props}

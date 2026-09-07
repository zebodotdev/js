---
title: Lifecycle and reconciliation
group: Guides
---

# Lifecycle, events, and reconciliation

Checkout exposes two related signals: the controller's current {@linkcode @inttegro/js!CheckoutState:type | CheckoutState} and a stream of sanitized {@linkcode @inttegro/js!CheckoutEvent:type | CheckoutEvent} objects. State tells you whether the embedded experience can be operated. Events tell you what the payer-facing workflow is doing.

Neither is a substitute for server-side Order state.

## Controller states

| State       | Meaning                                                                    | Safe host actions                                                         |
| ----------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `idle`      | Created but not mounted, cleanly unmounted, or reset after a failed mount. | Register events, call `mount()`, update presentation options, or destroy. |
| `mounting`  | The iframe exists and is negotiating readiness.                            | Keep the target mounted; wait for the promise or a failure.               |
| `ready`     | Hosted Checkout is interactive.                                            | Focus it, update locale/theme, observe events, or unmount/destroy.        |
| `destroyed` | Terminal controller state.                                                 | Create a new controller; this one cannot be mounted again.                |

A typical controller moves through:

```text
idle → mounting → ready → idle       (temporary unmount)
  └──── mount failure ───→ idle      (explicit retry is possible)
ready → destroyed                    (permanent cleanup)
```

Calling {@linkcode @inttegro/js!CheckoutController#unmount | CheckoutController.unmount} while mounting rejects the outstanding mount promise and returns the controller to `idle`. Calling {@linkcode @inttegro/js!CheckoutController#destroy | CheckoutController.destroy} is permanent and idempotent.

## Event meanings

Subscribe to a specific event with {@linkcode @inttegro/js!CheckoutController#on | CheckoutController.on}, or use {@linkcode @inttegro/js!CheckoutController#onEvent | CheckoutController.onEvent} for telemetry and exhaustive handling.

| Event                  | What it means                                                      | What it does not mean                                         |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `ready`                | The hosted UI is initialized and interactive.                      | The Order is paid or necessarily payable.                     |
| `change`               | Visible payer input changed; `complete` reports form completeness. | The input has passed final server or provider validation.     |
| `paymentAttempt`       | Valid input was submitted and an attempt began.                    | Funds were authorized or captured.                            |
| `confirmationRequired` | The payer must approve, enter a code, or follow a redirect.        | The host should collect the code or take over provider UI.    |
| `paymentAttemptFailed` | An individual attempt ended without completing the Order.          | The Order can never be paid or the payer canceled.            |
| `completed`            | Hosted Checkout reached its successful terminal experience.        | The browser event alone authorizes fulfillment.               |
| `canceled`             | The payer deliberately left or canceled the hosted flow.           | No server-side attempt remains pending.                       |
| `error`                | Hosted Checkout encountered an operational error.                  | Every error requires replacing the UI; inspect `recoverable`. |

Events intentionally omit account numbers, contact details, confirmation values, raw provider responses, customer identifiers, and the Order reference. Add your own non-sensitive correlation context when forwarding them to telemetry.

## Observe one event

Specific subscriptions narrow the event payload automatically:

```ts
const stopWatchingFailures = checkout.on(
  'paymentAttemptFailed',
  ({ code, recoverable, occurredAt }) => {
    analytics.track('checkout_attempt_failed', {
      checkoutCode: code,
      recoverable,
      occurredAt,
      pageSessionId,
    })
  },
)

// Remove only this handler when it is no longer useful.
stopWatchingFailures()
```

Use `recoverable` to classify telemetry or surrounding navigation behavior. Let hosted Checkout own retry instructions and payment-specific error copy so the payer does not see two competing explanations.

## Observe the complete lifecycle

An exhaustive switch makes new event handling decisions visible during TypeScript upgrades:

```ts
import type { CheckoutEvent } from '@inttegro/js'

function handleCheckoutEvent(event: CheckoutEvent): void {
  switch (event.type) {
    case 'ready':
      checkoutRegion.removeAttribute('aria-busy')
      break
    case 'change':
      setLeaveWarning(event.complete)
      break
    case 'paymentAttempt':
      setSurroundingNavigationDisabled(true)
      break
    case 'confirmationRequired':
      keepPaymentDialogOpen(event.kind)
      break
    case 'paymentAttemptFailed':
      recordAttemptFailure(event.code, event.recoverable)
      break
    case 'completed':
      beginServerReconciliation()
      break
    case 'canceled':
      preserveOrderForLater()
      break
    case 'error':
      reportCheckoutError(event.error)
      break
    default: {
      const neverEvent: never = event
      return neverEvent
    }
  }
}

const unsubscribe = checkout.onEvent(handleCheckoutEvent)
```

Event handler exceptions do not stop Checkout or other subscribers. They are rethrown in a microtask so your application's normal error monitoring can observe them.

## Reconcile before fulfillment

Treat browser completion as a prompt to refresh authoritative state:

```ts
checkout.on('completed', async () => {
  const response = await fetch(`/api/orders/${localOrderReference}/status`, {
    credentials: 'same-origin',
  })

  if (!response.ok) {
    showReconciliationPending()
    return
  }

  const order = await response.json()
  if (order.status === 'paid') {
    window.location.assign('/orders/complete')
  } else {
    showReconciliationPending()
  }
})
```

The browser endpoint in this example calls Inttegro from your server. It must authorize access using your application's own session and must not send an Inttegro secret key to the browser.

For asynchronous fulfillment, retrieve the Order from your server until it
reaches a terminal payment state. Make the fulfillment operation idempotent so
repeated status checks cannot ship, credit, or notify twice.

## Handle interruption and return visits

Mobile Money confirmation and redirects can outlive the page that initiated them. A payer can close a tab, lose connectivity, or return from another application after the browser event stream stopped.

Design the return route to retrieve the Order from your server and render its actual state. Do not infer failure just because a `completed` event was never observed. Likewise, do not infer success from a stale client flag.

## Retry initialization deliberately

Loader and mount errors reject promises with {@linkcode @inttegro/js!InttegroCheckoutError:class | InttegroCheckoutError}. A failed runtime load clears the loader's cached promise; a later call can retry. A failed mount returns a non-destroyed controller to `idle`.

Retry after a payer action rather than in an unbounded loop:

```ts
async function showCheckout(): Promise<void> {
  try {
    const inttegro = await loadInttegro()
    if (!inttegro) return

    checkout = inttegro.createCheckout({ orderId })
    checkout.onEvent(handleCheckoutEvent)
    await checkout.mount('#checkout')
  } catch (error) {
    renderRetryButton(() => void showCheckout())
    reportCheckoutInitialization(error)
  }
}
```

Do not automatically retry payment attempts from host code. Hosted Checkout decides when correction or retry is safe and communicates it to the payer.

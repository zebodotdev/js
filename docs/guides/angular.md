---
title: Angular
group: Framework adapters
---

# Integrate Checkout with Angular

Angular gives components explicit input, output, view-initialization, change, and destruction boundaries. `@inttegro/angular` maps Inttegro Checkout onto those boundaries with a standalone {@linkcode @inttegro/angular!CheckoutComponent:class | CheckoutComponent}: inputs configure the hosted experience, outputs expose its events, and Angular lifecycle hooks own the controller.

Prefer the official adapter for Angular 18 through 22. It works naturally with standalone application architecture and `OnPush` host components, while centralizing asynchronous mount cancellation and cleanup that would otherwise be repeated in directives or component hooks. Your application remains responsible for the route, surrounding layout, telemetry, and server reconciliation—not for the hosted controller's bookkeeping.

## Install the adapter

Use the package manager that owns your Angular workspace. With npm:

```bash
npm install @inttegro/angular
```

The adapter depends on `@inttegro/js`. Both are public integration packages; neither bundles the executable payment-collection runtime. After the Angular view initializes in a browser, the shared loader obtains that runtime from Inttegro's fixed origin.

Create and finalize the Order in a trusted server process. Resolve or transfer only its client-safe Order ID into the Angular route. Do not place Inttegro secret keys in `environment.ts`, transfer state, route data, or any other value delivered to the browser.

## Add Checkout to a standalone component

Import `CheckoutComponent` directly into the component that owns the payment route or payment action:

```ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import {
  CheckoutComponent,
  type CheckoutAppearance,
  type CheckoutErrorEvent,
  type CheckoutEvent,
} from '@inttegro/angular'

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CheckoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Complete your order</h1>

      @if (initializationFailed) {
        <p role="alert">
          Checkout could not load. Refresh the page to try again.
        </p>
      } @else {
        <inttegro-checkout
          [orderId]="orderId"
          [appearance]="appearance"
          locale="en-GH"
          title="Payment for your order"
          style="display: block; inline-size: 100%; min-block-size: 32rem"
          (event)="recordEvent($event)"
          (completed)="handleCompleted()"
          (error)="handleError($event)"
        />
      }
    </main>
  `,
})
export class PaymentPageComponent {
  @Input({ required: true }) orderId = ''
  @Input({ required: true }) pageSessionId = ''

  appearance: CheckoutAppearance = { theme: 'system' }
  initializationFailed = false

  recordEvent(event: CheckoutEvent): void {
    navigator.sendBeacon(
      '/telemetry/checkout',
      new Blob(
        [
          JSON.stringify({
            type: event.type,
            occurredAt: event.occurredAt,
            pageSessionId: this.pageSessionId,
          }),
        ],
        { type: 'application/json' },
      ),
    )
  }

  handleCompleted(): void {
    window.location.assign('/orders/complete')
  }

  handleError(failure: CheckoutErrorEvent | Error): void {
    if (failure instanceof Error) {
      this.initializationFailed = true
      navigator.sendBeacon(
        '/telemetry/checkout',
        new Blob(
          [
            JSON.stringify({
              type: 'initializationFailed',
              message: failure.message,
              pageSessionId: this.pageSessionId,
            }),
          ],
          { type: 'application/json' },
        ),
      )
    }
    // Hosted errors already pass through recordEvent. Checkout owns their copy.
  }
}
```

The completion page must retrieve the authoritative Order from your server
before fulfillment. An Angular output is a browser presentation signal, not
evidence that funds settled.

## How Angular lifecycle maps to Checkout

The standalone adapter implements `AfterViewInit`, `OnChanges`, and `OnDestroy`:

- `ngAfterViewInit()` begins loading only after Angular has created the container element.
- `ngOnChanges()` treats `features`, `orderId`, `presentation`, `timeout`, and `title` as controller identity. Changing one destroys the old controller and starts a new embedded or modal experience.
- Changes to `appearance` or `locale` call `update()` on the current controller instead.
- `ngOnDestroy()` unsubscribes and destroys the controller when a route or conditional block removes the component.
- A generation counter prevents an earlier asynchronous runtime load from claiming a view after a newer mount has started.

Angular reports input changes by reference. Replace the `appearance` object when changing its theme instead of mutating the existing object in place:

```ts
this.appearance = { theme: prefersDark ? 'dark' : 'light' }
```

Keep `<inttegro-checkout>` mounted while a payment attempt or external confirmation is pending. Removing the component ends the browser experience, although your server must still reconcile any attempt already submitted.

Set `presentation="modal"` when Checkout should open above the page. The shared runtime supplies the dialog, backdrop, responsive sizing, scrolling, close control, and focus behavior. The component exposes `dismiss()`, `focus()`, and `update()`; use a `@ViewChild` reference when host state must close the modal programmatically:

```ts
@ViewChild(CheckoutComponent) checkout?: CheckoutComponent

dismissCheckout(): void {
  this.checkout?.dismiss()
}
```

## Outputs and errors

The adapter follows Angular output conventions:

- `(event)` emits every sanitized {@linkcode @inttegro/angular!CheckoutEvent:type | CheckoutEvent};
- `(ready)` emits when the frame becomes interactive;
- `(completed)` emits at the successful hosted terminal state;
- `(canceled)` emits when a payer dismisses managed modal Checkout; and
- `(error)` emits initialization failures and sanitized hosted errors.

Use `(event)` for comprehensive telemetry, including `paymentAttempt`, `confirmationRequired`, and `paymentAttemptFailed`. The generic output fires before the matching specialized output for the same event.

An `Error` from `(error)` means the loader, configuration, or mount failed and a host-page fallback is appropriate. A {@linkcode @inttegro/angular!CheckoutErrorEvent:interface | CheckoutErrorEvent} came from hosted Checkout; record its sanitized code and recovery status without duplicating its payer-facing message.

## Server rendering and hydration

The adapter's template is a stable empty `div`. The core loader returns `null` outside a browser, and controller creation occurs only when a browser runtime is available. Angular SSR can therefore emit the host structure and hydrate it before the hosted frame takes ownership of the container.

Keep secret credentials on the server and transfer only the finalized Order ID. A new Order ID after navigation creates a fresh controller; a locale or theme change updates the mounted experience.

The current adapter does not expose `loadInttegro()` options. If your Content Security Policy requires a unique script or managed-modal style nonce per response, use `@inttegro/js` directly. For ordinary Angular component ownership, the standalone adapter is the preferred integration.

## Related resources

- [Framework adapter overview](./framework-adapters.md)
- [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md)
- [Security, CSP, and accessibility](./security-csp-and-accessibility.md)
- {@linkcode @inttegro/angular!CheckoutComponent:class | Angular Checkout component}

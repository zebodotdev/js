---
title: Security, CSP, and accessibility
group: Guides
---

# Security, CSP, and accessibility

Inttegro's web packages keep sensitive payment collection inside an Inttegro-hosted experience. Your application still owns the security of the surrounding page, the Order creation endpoint, deployment dependencies, content security policy, analytics, and fulfillment decisions.

## Preserve the controlled-runtime boundary

The executable Checkout runtime is served only from {@linkcode @inttegro/js!INTTEGRO_JS_URL:variable | INTTEGRO_JS_URL}. The npm packages contain a small loader, public types, and framework adapters. They do not contain a distributable copy of the payment runtime.

Do not:

- download and self-host the runtime;
- copy it into your application's public directory;
- pass it through your own asset proxy or service worker cache;
- bundle it into application JavaScript;
- replace {@linkcode @inttegro/js!INTTEGRO_JS_URL:variable | INTTEGRO_JS_URL} with an environment-specific URL; or
- trust a manually assigned `window.Inttegro` global.

Use {@linkcode @inttegro/js!loadInttegro:function | loadInttegro}. It accepts a script only when its resolved `src` exactly matches the fixed Inttegro URL and validates the runtime protocol before returning it.

## Configure Content Security Policy

Start from your existing policy and add the narrow Inttegro origins required by Checkout. A representative policy is:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://js.inttegro.com 'nonce-{RANDOM_PER_RESPONSE_VALUE}';
  frame-src https://pages.inttegro.com;
  connect-src 'self' https://api.inttegro.com;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'self';
  base-uri 'self';
  object-src 'none'
```

Adapt directives to the resources your own application uses. Do not copy the example unchanged without testing it in report-only mode. Hosted Checkout's exact production origins must match your Inttegro deployment documentation.

If your `script-src` requires nonces, generate a cryptographically random value for every HTML response, place the same value in the response header, and pass it to {@linkcode @inttegro/js!loadInttegro:function | loadInttegro}:

```ts
const inttegro = await loadInttegro({ nonce: window.__cspNonce })
```

Never hard-code a nonce or reuse it between responses. The nonce is applied only when that call creates the shared runtime script. Framework adapters currently do not expose loader options, so applications with a mandatory script nonce should use `@inttegro/js` directly.

Subresource Integrity is not appropriate for the versioned hosted URL when Inttegro may deploy compatible fixes at that URL. The controlled origin, TLS, strict CSP, loader validation, and Inttegro's release controls form the delivery boundary.

## Keep secrets and personal data out of the host page

Pass only a client-safe finalized Order ID in {@linkcode @inttegro/js!CheckoutOptions:interface | CheckoutOptions}. Secret API keys belong on your server. Do not attach account numbers, billing addresses, phone numbers, provider confirmation codes, or payment-method identifiers to host-page analytics.

Checkout events are deliberately sparse. Preserve that property when instrumenting the host application:

```ts
checkout.onEvent((event) => {
  telemetry.capture('inttegro_checkout_event', {
    type: event.type,
    occurredAt: event.occurredAt,
    route: location.pathname,
    pageSessionId,
  })
})
```

If you add an Order correlation value, prefer your own opaque internal reference. Apply your normal access controls and retention rules. Do not log full runtime messages, DOM content, network bodies, or exceptions that might have been enriched elsewhere with payer data.

## Embed Checkout accessibly

Checkout owns the semantics and keyboard behavior inside its iframe. The host page owns the context around it.

- Provide a visible page or dialog heading that explains the task.
- Set `title` to a concise accessible name such as `Payment for your order`.
- Give the container enough height that controls are not clipped or placed behind a sticky action bar.
- Do not cover the iframe with loading overlays after `ready`.
- Preserve browser zoom and responsive reflow.
- Keep the same controller mounted during payment and confirmation.
- Use `system` theme by default so Checkout follows the payer's preference.
- Put host-page validation errors outside the frame only when they concern host-owned fields.

The iframe title is not visible marketing copy. It gives screen-reader and browser tooling a name for the embedded experience.

## Use Checkout in a modal or dialog

Checkout can be rendered in a modal when the dialog provides a stable, visible container. Mount only after the dialog content exists. Move focus into Checkout after the opening transition, and restore focus to the control that opened the dialog when it closes.

```ts
const opener = document.activeElement as HTMLElement | null
dialog.showModal()

const inttegro = await loadInttegro()
if (!inttegro) return

const checkout = inttegro.createCheckout({
  orderId,
  title: 'Payment for your order',
  appearance: { theme: 'system' },
})

checkout.on('ready', () => checkout.focus())
checkout.on('canceled', closePaymentDialog)
checkout.on('completed', beginServerReconciliation)
await checkout.mount(dialog.querySelector('.checkout-target')!)

function closePaymentDialog(): void {
  checkout.destroy()
  dialog.close()
  opener?.focus()
}
```

Do not destroy and recreate Checkout during cosmetic dialog transitions. Ensure the close control remains reachable by keyboard and assistive technology. If the payer closes during a pending attempt, reconcile Order state instead of assuming failure.

## Treat errors according to their boundary

{@linkcode @inttegro/js!InttegroCheckoutError:class | InttegroCheckoutError} describes loader, configuration, and controller lifecycle failures. {@linkcode @inttegro/js!CheckoutErrorEvent:interface | CheckoutErrorEvent} describes sanitized operational errors reported by hosted Checkout. These are different shapes and can reach the same framework `onError` or `error` hook.

Use stable error codes for telemetry and coarse recovery decisions. Show calm, payer-oriented copy rather than raw error messages. Hosted Checkout owns detailed payment-method correction and retry instructions.

## Verify server-side outcomes

No browser signal—including `completed`—is proof that fulfillment should occur. Retrieve the Order with server credentials or consume signed webhooks. Make fulfillment idempotent, account for late confirmation, and retain enough server-side history to reconcile interruptions without collecting sensitive payer input in the browser.

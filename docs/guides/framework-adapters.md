---
title: Framework adapters
group: Guides
---

# Framework adapters

The official framework adapters embed the same Inttegro-hosted Checkout as `@inttegro/js`, but express its lifecycle through the component model your application already uses. They are the normal integration path for framework applications: less application-owned orchestration, fewer controller leaks during navigation, and events that fit naturally into existing state and telemetry code.

The adapters are public packages. They contain components and TypeScript declarations, not the sensitive payment-collection runtime. Each adapter delegates to `@inttegro/js`, which loads the executable runtime from {@linkcode @inttegro/js!INTTEGRO_JS_URL:variable | Inttegro's fixed origin}. Payment fields and provider interactions remain inside the Inttegro-hosted frame.

## Choose your adapter

| Application             | Package                | Integration model                                               |
| ----------------------- | ---------------------- | --------------------------------------------------------------- |
| [React](./react.md)     | `@inttegro/react`      | Component props, callback props, effects, and an imperative ref |
| [Vue](./vue.md)         | `@inttegro/vue`        | Reactive props, emitted events, watchers, and a template ref    |
| [Svelte](./svelte.md)   | `@inttegro/svelte`     | Svelte 5 runes, callback props, and effect cleanup              |
| [Angular](./angular.md) | `@inttegro/angular`    | Standalone component, inputs, outputs, and lifecycle hooks      |
| [Inertia](./inertia.md) | Use the client adapter | React, Vue, or Svelte page props and visit lifecycle            |

Install only the adapter for your application. The adapter declares `@inttegro/js` as a dependency, so one package gives you the framework component, loader, and shared public types.

```bash
npm install @inttegro/react
# Replace react with vue, svelte, or angular.
```

Equivalent `yarn add`, `bun add`, and `deno add npm:` commands are supported. Use the package manager already responsible for your dependency graph.

## What the adapters manage

Every adapter applies the same controller rules through different framework primitives:

| Change or lifecycle event                                | Adapter behavior                                     |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `appearance` or `locale` changes                         | Updates the active controller in place               |
| `orderId`, `presentation`, `timeout`, or `title` changes | Destroys the controller and starts a new experience  |
| Component or view is removed                             | Unsubscribes from events and destroys the controller |
| Runtime loading finishes after removal                   | Discards the stale result without mounting           |

That last behavior matters in real applications. Route transitions, conditional rendering, development lifecycle probes, and rapidly changing props can all remove a component while the hosted runtime is still loading. The adapters guard those asynchronous boundaries so a stale Checkout cannot mount into a view that no longer owns it.

Each adapter forwards the complete sanitized {@linkcode @inttegro/js!CheckoutEvent:type | Checkout event stream}, along with convenient `ready`, `completed`, `canceled`, and `error` hooks. Set `presentation` to `modal` and the shared runtime supplies the dialog, backdrop, responsive sizing, close controls, scrolling, and focus behavior. The generic event hook remains the right place for telemetry and events such as `paymentAttempt`, `confirmationRequired`, and `paymentAttemptFailed`. Browser completion is useful for navigation, but your server must still verify the Order before fulfillment.

## Why use an official adapter

Calling `@inttegro/js` directly is deliberately possible, but it makes your application responsible for controller ownership, subscription cleanup, race cancellation, and deciding which prop changes require replacement. The official adapter centralizes those rules in code maintained alongside the core contract.

Prefer the adapter when Checkout lives in a framework-rendered route or component. It gives reviewers an integration that looks native to the rest of the application, follows framework teardown automatically, and upgrades with the shared event and option types. For modal Checkout, the framework decides when the component exists while Inttegro owns the modal itself. You still control routing, telemetry, and server reconciliation; Inttegro controls the hosted payment experience and its modal shell.

Use `@inttegro/js` directly when your host is framework-free, you intentionally manage a controller outside the component tree, or your Content Security Policy requires passing a per-response nonce to {@linkcode @inttegro/js!loadInttegro:function | loadInttegro}. The current adapters do not expose loader options.

## Continue with your framework

- [Integrate Checkout with React](./react.md)
- [Integrate Checkout with Vue](./vue.md)
- [Integrate Checkout with Svelte](./svelte.md)
- [Integrate Checkout with Angular](./angular.md)
- [Integrate Checkout with Inertia](./inertia.md)

Read [Lifecycle and reconciliation](./lifecycle-and-reconciliation.md) before connecting fulfillment or analytics, and [Security, CSP, and accessibility](./security-csp-and-accessibility.md) before deploying.

/**
 * Color scheme used inside hosted Checkout.
 *
 * `system` follows the payer's current browser preference and updates when that
 * preference changes. Choose an explicit theme when Checkout sits in a surface
 * that does not follow the page-level color scheme, such as a fixed-theme modal.
 *
 * @category Configuration
 */
export type CheckoutTheme = 'light' | 'dark' | 'system'

/** Ways a framework adapter can display hosted Checkout. */
export type CheckoutPresentation = 'embedded' | 'modal'

/**
 * Visual preferences applied inside the hosted Checkout frame.
 *
 * The frame owns its controls, typography, payment-method presentation, and
 * validation UI so the payment experience remains consistent across merchants.
 * Your application controls the size and placement of the outer container.
 *
 * @category Configuration
 */
export interface CheckoutAppearance {
  /**
   * Checkout color scheme. Defaults to the hosted experience's system-aware
   * behavior when omitted.
   */
  theme?: CheckoutTheme | undefined
}

/** Optional content and actions exposed by hosted Checkout. */
export interface CheckoutFeatures {
  /** Shows the finalized Order's line items before payment. Defaults to `false`. */
  showLineItems?: boolean | undefined
  /** Offers the invoice after payment succeeds. Defaults to `true`. */
  showInvoiceDownload?: boolean | undefined
  /** Offers the receipt after payment succeeds. Defaults to `true`. */
  showReceiptDownload?: boolean | undefined
  /** Lets the payer replace an attached payment method. Defaults to `true`. */
  allowPaymentMethodChange?: boolean | undefined
}

/**
 * Immutable and initial configuration for one Checkout controller.
 *
 * Changing `features`, `orderId`, `timeout`, or `title` requires a new
 * controller. Use {@link CheckoutController.update} for locale and theme
 * changes after creation.
 *
 * @category Configuration
 */
export interface CheckoutOptions {
  /**
   * Client-safe reference for the finalized Inttegro Order being paid.
   *
   * Create and finalize the Order on your server, then send only this reference
   * to the browser. The payer may complete the Order but cannot use Checkout to
   * change its commercial terms. Never place an Inttegro secret API key in this
   * object or anywhere else in browser code.
   */
  orderId: string
  /** Initial color-scheme preferences for the hosted experience. */
  appearance?: CheckoutAppearance | undefined
  /** Optional hosted Checkout content and actions. */
  features?: CheckoutFeatures | undefined
  /**
   * BCP 47 locale preference, such as `en-GH`. Unsupported translations may
   * fall back to an Inttegro-supported locale.
   */
  locale?: string | undefined
  /**
   * Accessible title assigned to the hosted iframe. Defaults to `Checkout`.
   * Describe the frame's purpose; this value is not visible payment-page copy.
   */
  title?: string | undefined
  /**
   * Milliseconds to wait for the hosted checkout to emit `CheckoutReadyEvent`.
   * Accepts 1,000–60,000 ms and defaults to 15,000 ms. A timeout rejects
   * `CheckoutController.mount` and returns the controller to `idle`, so a
   * deliberate retry can mount it again.
   */
  timeout?: number | undefined
}

/**
 * The validated runtime currently served from Inttegro's controlled origin.
 *
 * Obtain this object from {@link loadInttegro}; do not read or fabricate the
 * browser global directly.
 *
 * @category Loading Checkout
 */
export interface InttegroRuntime {
  /** Hosted runtime release currently executing on the page. */
  readonly version: string
  /**
   * Major browser-to-frame messaging protocol implemented by this runtime.
   * The loader rejects runtimes that do not implement the supported version.
   */
  readonly protocolVersion: number
  /**
   * Creates an unmounted controller for one finalized Order.
   *
   * Creation validates configuration synchronously but performs no network or
   * DOM work. Register lifecycle handlers before calling
   * {@link CheckoutController.mount} so early events are not missed.
   *
   * @param options - Order identity and initial presentation configuration.
   * @returns A controller in the `idle` state.
   * @throws {@link InttegroCheckoutError} with `invalid_order_id`,
   * `invalid_locale`, or `invalid_timeout` for invalid options.
   */
  createCheckout(options: CheckoutOptions): CheckoutController
}

/**
 * Options used while downloading the hosted runtime.
 *
 * @category Configuration
 */
export interface InttegroLoadOptions {
  /**
   * Content Security Policy nonce copied to the script element created by the
   * loader. Supply the nonce generated for the current HTTP response; never
   * hard-code or reuse one across responses.
   */
  nonce?: string | undefined
}

/**
 * Configuration that can change without replacing the Checkout controller.
 *
 * @category Configuration
 */
export interface CheckoutUpdateOptions {
  /** New color-scheme preference for the mounted or next-mounted frame. */
  appearance?: CheckoutAppearance | undefined
  /** New BCP 47 locale preference, such as `en-GH`. */
  locale?: string | undefined
}

/**
 * Current lifecycle state of a {@link CheckoutController}.
 *
 * - `idle`: created but not mounted, cleanly unmounted, or returned after a
 *   failed mount; {@link CheckoutController.mount} may be called.
 * - `mounting`: the iframe exists and is negotiating readiness.
 * - `ready`: Checkout is interactive and {@link CheckoutController.mount} has
 *   resolved.
 * - `destroyed`: terminal state; create a new controller to show Checkout again.
 *
 * @category Lifecycle
 */
export type CheckoutState = 'idle' | 'mounting' | 'ready' | 'destroyed'

interface CheckoutEventBase {
  /**
   * ISO 8601 timestamp recorded by hosted Checkout when the event occurred.
   * Use it for ordering and telemetry context, not as proof of payment.
   */
  occurredAt: string
}

/**
 * Emitted once the hosted checkout is initialized and interactive.
 *
 * The corresponding {@link CheckoutController.mount} promise resolves at the
 * same point. This event means the UI is ready; it does not mean the Order is
 * payable or paid.
 *
 * @category Events
 */
export interface CheckoutReadyEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'ready'
}

/**
 * Emitted when payer input changes the completion state of the form.
 *
 * Treat `complete` as a presentation hint only. Checkout revalidates the input
 * before starting payment, and your server remains the authority for final
 * Order status.
 *
 * @category Events
 */
export interface CheckoutChangeEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'change'
  /** Whether the currently visible payment form has enough valid input to submit. */
  complete: boolean
  /** Selected payment-method family, when Checkout can expose it safely. */
  paymentMethod?: 'mobile_money' | undefined
}

/**
 * Emitted when the payer submits valid details and a payment attempt begins.
 *
 * Use this for progress telemetry or to disable surrounding navigation. Do not
 * treat it as authorization or confirmation that funds moved.
 *
 * @category Events
 */
export interface CheckoutPaymentAttemptEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'paymentAttempt'
}

/**
 * Emitted when a payment requires an additional payer step.
 *
 * The hosted experience owns the confirmation UI. The host application can use
 * this event for non-sensitive analytics or to keep a modal open, but should
 * not collect confirmation codes or intercept provider redirects.
 *
 * @category Events
 */
export interface CheckoutConfirmationRequiredEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'confirmationRequired'
  /**
   * Shape of the next step: approval in another channel, an in-frame code, or
   * a user-initiated redirect.
   */
  kind: 'authorization' | 'code' | 'redirect'
}

/**
 * Emitted when one payment attempt ends without completing the Order.
 *
 * If `recoverable` is true, Checkout remains responsible for presenting an
 * appropriate retry or correction path. If false, do not force an automatic
 * retry; allow Checkout to show the terminal outcome and reconcile Order state
 * from your server.
 *
 * @category Events
 */
export interface CheckoutPaymentAttemptFailedEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'paymentAttemptFailed'
  /** Stable hosted-checkout failure code for telemetry and coarse UI decisions. */
  code: string
  /** Whether the same Checkout can offer the payer another attempt. */
  recoverable: boolean
}

/**
 * Emitted when hosted Checkout reaches its successful terminal state.
 *
 * Navigate to your completion view or begin server-side reconciliation here.
 * For fulfillment, independently retrieve the Order or process the signed
 * server webhook; a browser event can be interrupted, replayed, or suppressed.
 *
 * @category Events
 */
export interface CheckoutCompletedEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'completed'
}

/**
 * Emitted when the payer deliberately exits or cancels the hosted flow.
 *
 * Cancellation is not a payment failure and does not guarantee that no attempt
 * is pending. Preserve the Order reference so your server can reconcile or the
 * payer can return later.
 *
 * @category Events
 */
export interface CheckoutCanceledEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'canceled'
}

/**
 * Safe error details emitted by hosted Checkout.
 *
 * The object excludes account numbers, billing details, confirmation values,
 * customer identifiers, Order references, and raw provider responses.
 *
 * @category Errors
 */
export interface CheckoutErrorDetail {
  /** Stable reason for the hosted-checkout error. */
  code: string
  /** Human-readable diagnostic description. */
  message: string
  /** Whether hosted Checkout can continue without replacing the controller. */
  recoverable: boolean
}

/**
 * Emitted when the hosted experience encounters an operational error.
 *
 * This event is distinct from a rejected `CheckoutController.mount`,
 * which indicates that the SDK could not initialize Checkout. Recoverable
 * hosted errors remain inside the payment UI; use the event for observability
 * without rendering duplicate or more technical error copy around the frame.
 *
 * @category Events
 */
export interface CheckoutErrorEvent extends CheckoutEventBase {
  /** Event discriminator. */
  type: 'error'
  /** Sanitized failure details safe for application telemetry. */
  error: CheckoutErrorDetail
}

/**
 * Discriminated union of every public hosted Checkout lifecycle event.
 *
 * Switch on `type` for exhaustive event handling. Event payloads are deliberately
 * minimal and never include payment credentials or contact details.
 *
 * @category Events
 */
export type CheckoutEvent =
  | CheckoutReadyEvent
  | CheckoutChangeEvent
  | CheckoutPaymentAttemptEvent
  | CheckoutConfirmationRequiredEvent
  | CheckoutPaymentAttemptFailedEvent
  | CheckoutCompletedEvent
  | CheckoutCanceledEvent
  | CheckoutErrorEvent

/**
 * Valid event names accepted by {@link CheckoutController.on}.
 *
 * @category Events
 */
export type CheckoutEventType = CheckoutEvent['type']

/**
 * Selects the payload associated with one {@link CheckoutEventType}.
 *
 * This powers type-safe event callbacks. For example,
 * `CheckoutEventOfType<'error'>` resolves to {@link CheckoutErrorEvent}.
 *
 * @typeParam Type - Event discriminator to select.
 * @category Events
 */
export type CheckoutEventOfType<Type extends CheckoutEventType> = Extract<
  CheckoutEvent,
  { type: Type }
>

/**
 * Type-safe handler for one hosted Checkout event name.
 *
 * @typeParam Type - Event discriminator delivered to the handler.
 * @category Events
 */
export type CheckoutEventHandler<Type extends CheckoutEventType> = (
  event: CheckoutEventOfType<Type>,
) => void

/**
 * Owns the lifecycle of one hosted Checkout instance.
 *
 * Create a controller with {@link InttegroRuntime.createCheckout}, subscribe to
 * events, and then either mount it in an empty HTML element or ask Inttegro to
 * present it in a managed modal. A controller may be unmounted and mounted
 * again, but cannot be reused after `destroy()`. Framework adapters manage this
 * lifecycle automatically.
 *
 * @example Mount, observe, and clean up a controller
 * ```ts
 * const checkout = inttegro.createCheckout({ orderId })
 * const unsubscribe = checkout.on('completed', handleCompleted)
 *
 * try {
 *   await checkout.mount(container)
 * } catch (error) {
 *   showCheckoutUnavailable(error)
 * }
 *
 * // When the surrounding view is permanently removed:
 * unsubscribe()
 * checkout.destroy()
 * ```
 *
 * @category Checkout
 */
export interface CheckoutController {
  /** Read-only lifecycle state at the time it is accessed. */
  readonly state: CheckoutState
  /**
   * Creates the hosted iframe inside an empty target and waits until it is
   * interactive.
   *
   * The target may be an element or a CSS selector. The promise resolves when
   * the `ready` event is received. It rejects if the frame fails, times out, or
   * is unmounted while initialization is pending; after those failures the
   * controller returns to `idle` and may be mounted again.
   *
   * @param target - Existing HTML element or CSS selector that resolves to one.
   * @throws {@link InttegroCheckoutError} with `unsupported_environment`,
   * `destroyed`, `already_mounted`, `target_not_found`, `mount_failed`, or
   * `mount_timeout`.
   */
  mount(target: string | HTMLElement): Promise<void>
  /**
   * Presents Checkout in an Inttegro-managed modal and waits until it is ready.
   *
   * No target element or application modal is required. The runtime owns the
   * backdrop, responsive sizing, viewport scrolling, close controls, focus
   * containment and restoration, page scroll lock, and teardown. A payer who
   * dismisses the modal before completion produces a
   * {@link CheckoutCanceledEvent}.
   *
   * @throws {@link InttegroCheckoutError} with the same initialization errors
   * as {@link mount}.
   */
  present(): Promise<void>
  /**
   * Closes a managed modal and returns the controller to `idle`.
   *
   * Calling this method for an embedded or already-dismissed Checkout is safe
   * and has no effect. Dismissing before completion emits one
   * {@link CheckoutCanceledEvent}; dismissing after completion does not turn a
   * successful payment into a cancellation.
   */
  dismiss(): void
  /**
   * Removes the iframe and browser listeners while keeping the controller reusable.
   *
   * Calling this method during `mounting` rejects the outstanding
   * {@link mount} promise with `mount_failed`. Calling it while idle or after
   * destruction is safe. Event subscriptions remain registered for a later
   * mount; call {@link destroy} for permanent cleanup.
   */
  unmount(): void
  /**
   * Permanently removes Checkout and all event subscriptions.
   *
   * Destruction is idempotent. A destroyed controller cannot be mounted again;
   * create a new one if the flow must restart.
   */
  destroy(): void
  /**
   * Moves focus into the first actionable control in hosted Checkout.
   *
   * Use this after opening Checkout in a dialog or when validation elsewhere on
   * the page sends the payer back to payment collection.
   *
   * @throws {@link InttegroCheckoutError} with `not_mounted` unless the
   * controller is `ready`.
   */
  focus(): void
  /**
   * Changes locale or color scheme without replacing the iframe.
   *
   * Updates made before `ready` are stored and applied during initialization.
   * Ready controllers receive the update immediately. Invalid locales throw
   * synchronously and leave the previous locale unchanged.
   *
   * @param options - Mutable presentation settings to apply.
   * @throws {@link InttegroCheckoutError} with `invalid_locale`.
   */
  update(options: CheckoutUpdateOptions): void
  /**
   * Subscribes to every public lifecycle event.
   *
   * Register the handler before {@link mount} to observe initialization. A
   * handler exception is rethrown in a microtask so it cannot stop Checkout or
   * other subscribers; install your normal global error monitoring as well.
   *
   * @param handler - Callback invoked for each sanitized event.
   * @returns An idempotent function that removes this subscription.
   */
  onEvent(handler: (event: CheckoutEvent) => void): () => void
  /**
   * Subscribes to one lifecycle event with a correctly narrowed payload type.
   *
   * Register before {@link mount} when listening for `ready`. The returned
   * cleanup function should be called when the host view is removed unless the
   * controller will immediately be destroyed.
   *
   * @typeParam Type - Event discriminator to observe.
   * @param type - Public event name.
   * @param handler - Callback receiving that event's payload.
   * @returns An idempotent function that removes this subscription.
   */
  on<Type extends CheckoutEventType>(
    type: Type,
    handler: CheckoutEventHandler<Type>,
  ): () => void
}

import type {
  CheckoutAppearance,
  CheckoutErrorEvent,
  CheckoutEvent,
  CheckoutFeatures,
} from '@inttegro/js'

/**
 * Props accepted by the Inttegro {@link Checkout} component.
 *
 * `features`, `orderId`, `timeout`, and `title` identify a hosted experience;
 * changing one destroys the current controller and mounts a new one.
 * `appearance` and `locale` update the current controller in place.
 *
 * @category Svelte
 */
export interface CheckoutProps {
  /** Initial and reactive theme preference for hosted Checkout. */
  appearance?: CheckoutAppearance | undefined
  /** Hosted Checkout content and actions. Changing it replaces the controller. */
  features?: CheckoutFeatures | undefined
  /** CSS class applied to the outer container owned by your Svelte application. */
  class?: string | undefined
  /** Initial and reactive BCP 47 locale preference. */
  locale?: string | undefined
  /**
   * Called after the successful hosted terminal state. Reconcile the Order on
   * your server before fulfillment.
   */
  onCompleted?:
    ((event: Extract<CheckoutEvent, { type: 'completed' }>) => void) | undefined
  /** Called for loader/mount failures and sanitized hosted errors. */
  onError?: ((event: CheckoutErrorEvent | Error) => void) | undefined
  /** Called for every sanitized lifecycle event. */
  onEvent?: ((event: CheckoutEvent) => void) | undefined
  /** Called once Checkout is initialized and interactive. */
  onReady?:
    ((event: Extract<CheckoutEvent, { type: 'ready' }>) => void) | undefined
  /** Client-safe reference for the finalized Order being paid. */
  orderId: string
  /** Mount timeout from 1,000–60,000 ms; defaults to 15,000 ms. */
  timeout?: number | undefined
  /** Accessible iframe title; defaults to `Checkout`. */
  title?: string | undefined
}

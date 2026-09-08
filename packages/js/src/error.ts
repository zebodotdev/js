/**
 * A stable, machine-readable reason why the loader or checkout controller could
 * not complete an operation.
 *
 * Use the code to decide whether to retry, correct integration configuration,
 * or show a temporary failure state. Do not branch on the human-readable error
 * message, which may change between releases.
 *
 * - `already_mounted`: {@link CheckoutController.mount} was called more than
 *   once without an intervening {@link CheckoutController.unmount}.
 * - `destroyed`: an operation attempted to mount a controller after
 *   {@link CheckoutController.destroy} made it permanently unusable.
 * - `invalid_locale`: the supplied locale is not a well-formed BCP 47 tag.
 * - `invalid_features`: a Checkout feature flag is not a boolean.
 * - `invalid_order_id`: the Order reference is empty, too long, or contains
 *   unsupported characters.
 * - `invalid_runtime`: a global runtime did not come from the required hosted
 *   script or does not implement the supported protocol.
 * - `invalid_timeout`: the mount timeout falls outside 1,000–60,000 ms.
 * - `mount_failed`: the hosted frame failed, reported an initialization error,
 *   or was unmounted before becoming ready.
 * - `mount_timeout`: the hosted frame did not become ready before the timeout.
 * - `not_mounted`: an operation requires a ready, mounted checkout.
 * - `runtime_load_failed`: the browser could not download the hosted runtime.
 * - `runtime_load_timeout`: the hosted runtime did not load within 15 seconds.
 * - `target_not_found`: the mount target is missing or is not an HTML element.
 * - `unsupported_environment`: a browser-only operation ran during SSR or in
 *   another non-DOM environment.
 *
 * @category Errors
 */
export type InttegroCheckoutErrorCode =
  | 'already_mounted'
  | 'destroyed'
  | 'invalid_locale'
  | 'invalid_features'
  | 'invalid_order_id'
  | 'invalid_runtime'
  | 'invalid_timeout'
  | 'mount_failed'
  | 'mount_timeout'
  | 'not_mounted'
  | 'runtime_load_failed'
  | 'runtime_load_timeout'
  | 'target_not_found'
  | 'unsupported_environment'

/**
 * An integration error raised by `@inttegro/js` before or while hosted Checkout
 * is initialized.
 *
 * This error describes SDK and browser failures. Payment failures reported by
 * the hosted experience arrive as {@link CheckoutPaymentAttemptFailedEvent} or
 * {@link CheckoutErrorEvent} instead. That distinction lets an application
 * separate integration monitoring from customer payment outcomes.
 *
 * @example Handle a failed mount without inspecting error text
 * ```ts
 * try {
 *   await checkout.mount('#checkout')
 * } catch (error) {
 *   if (
 *     error instanceof InttegroCheckoutError &&
 *     error.code === 'mount_timeout'
 *   ) {
 *     showRetryButton()
 *   } else {
 *     reportIntegrationError(error)
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class InttegroCheckoutError extends Error {
  /** Stable error code intended for programmatic handling. */
  readonly code: InttegroCheckoutErrorCode

  /**
   * Creates an SDK error.
   *
   * Applications normally receive instances from {@link loadInttegro} or a
   * {@link CheckoutController}; they do not need to construct these errors.
   *
   * @param code - Stable reason for the failure.
   * @param message - Diagnostic description suitable for logs. Do not show it
   * directly to a payer without reviewing the copy.
   */
  constructor(code: InttegroCheckoutErrorCode, message: string) {
    super(message)
    this.name = 'InttegroCheckoutError'
    this.code = code
  }
}

/**
 * Svelte component adapter for Inttegro-hosted Checkout.
 *
 * `Checkout` loads the runtime in a browser effect and destroys its controller
 * when the component leaves the page. Keep it mounted while a payment attempt
 * or external confirmation is pending.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { Checkout } from '@inttegro/svelte'
 *   let { orderId }: { orderId: string } = $props()
 * </script>
 *
 * <Checkout
 *   {orderId}
 *   presentation="modal"
 *   appearance={{ theme: 'system' }}
 *   onCompleted={() => location.assign('/orders/complete')}
 *   onError={reportCheckoutError}
 * />
 * ```
 *
 * @module @inttegro/svelte
 */
export { default as Checkout } from './Checkout.svelte'
export type { CheckoutProps } from './types'
export type {
  CheckoutAppearance,
  CheckoutErrorEvent,
  CheckoutEvent,
  CheckoutFeatures,
  CheckoutPresentation,
  CheckoutTheme,
} from '@inttegro/js'

import {
  loadInttegro,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
  type CheckoutOptions,
  type CheckoutPresentation,
} from '@inttegro/js'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react'

/**
 * Props for {@link Checkout}.
 *
 * `features`, `orderId`, `presentation`, `timeout`, and `title` identify the
 * experience. Changing one replaces the underlying controller. `appearance`
 * and `locale` update the existing controller without discarding payer
 * progress.
 *
 * @category React
 */
export interface CheckoutProps extends CheckoutOptions {
  /** CSS class applied to the outer container owned by your React application. */
  className?: string
  /** Inline styles applied to the outer container, never to controls inside Checkout. */
  style?: CSSProperties
  /** Displays Checkout inline by default or in an Inttegro-managed modal. */
  presentation?: CheckoutPresentation
  /** Called when a payer dismisses managed modal Checkout before completion. */
  onCanceled?: (event: Extract<CheckoutEvent, { type: 'canceled' }>) => void
  /**
   * Called after Checkout reports its successful terminal state.
   * Use this to navigate or refresh server-owned Order state, not as the sole
   * signal for fulfillment.
   */
  onCompleted?: (event: Extract<CheckoutEvent, { type: 'completed' }>) => void
  /**
   * Called for loader/mount errors and sanitized hosted errors.
   * Use `error instanceof InttegroCheckoutError` or check for an event `type`
   * before reading framework-independent details.
   */
  onError?: (event: CheckoutErrorEvent | Error) => void
  /** Called for every sanitized lifecycle event, including events above. */
  onEvent?: (event: CheckoutEvent) => void
  /** Called once the iframe is interactive and its mount promise has resolved. */
  onReady?: (event: Extract<CheckoutEvent, { type: 'ready' }>) => void
}

/**
 * Imperative operations exposed by {@link Checkout} through a React ref.
 *
 * Prefer props for normal updates. Use the handle for focus management in
 * dialogs or for updates driven by imperative host integrations.
 *
 * @category React
 */
export interface CheckoutHandle {
  /** Closes managed modal Checkout when it is open. */
  dismiss(): void
  /** Moves focus into Checkout when its controller is ready; otherwise does nothing. */
  focus(): void
  /** Applies a new locale or theme when the controller exists. */
  update(options: Parameters<CheckoutController['update']>[0]): void
}

/**
 * Displays Inttegro-hosted Checkout in a React application.
 *
 * The component renders an empty `div`, loads the executable runtime from
 * Inttegro's fixed origin after mount, creates a controller for `orderId`, and
 * destroys it during cleanup. Server rendering is safe because no runtime is
 * loaded until the effect runs in a browser.
 *
 * Changing `features`, `orderId`, `presentation`, `timeout`, or `title` starts
 * a fresh hosted experience. Changing `appearance` or `locale` updates the
 * active experience in place. Keep the component mounted while a payment is
 * pending or confirmation is in progress.
 *
 * @example Present Checkout without building a dialog
 * ```tsx
 * import { Checkout } from '@inttegro/react'
 *
 * function Payment({ orderId }: { orderId: string }) {
 *   return (
 *     <Checkout
 *       orderId={orderId}
 *       presentation="modal"
 *       appearance={{ theme: 'system' }}
 *       onCompleted={() => location.assign(`/orders/${orderId}/complete`)}
 *       onError={(error) => reportCheckoutError(error)}
 *     />
 *   )
 * }
 * ```
 *
 * @category React
 */
export const Checkout = forwardRef<CheckoutHandle, CheckoutProps>(
  function Checkout(
    {
      appearance,
      className,
      features,
      locale,
      onCanceled,
      onCompleted,
      onError,
      onEvent,
      onReady,
      orderId,
      presentation = 'embedded',
      style,
      timeout,
      title,
    },
    forwardedRef,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const checkoutRef = useRef<CheckoutController | null>(null)
    const callbacksRef = useRef({
      onCanceled,
      onCompleted,
      onError,
      onEvent,
      onReady,
    })
    const updateOptionsRef = useRef({ appearance, locale })
    const hasFeatureOverrides = features !== undefined
    const showLineItems = features?.showLineItems
    const showInvoiceDownload = features?.showInvoiceDownload
    const showReceiptDownload = features?.showReceiptDownload
    const allowPaymentMethodChange = features?.allowPaymentMethodChange
    callbacksRef.current = {
      onCanceled,
      onCompleted,
      onError,
      onEvent,
      onReady,
    }
    updateOptionsRef.current = { appearance, locale }

    useImperativeHandle(
      forwardedRef,
      () => ({
        dismiss: () => checkoutRef.current?.dismiss(),
        focus: () => checkoutRef.current?.focus(),
        update: (options) => checkoutRef.current?.update(options),
      }),
      [],
    )

    useEffect(() => {
      const target = containerRef.current
      if (presentation === 'embedded' && !target) return

      let active = true
      let canceled = false
      let checkout: CheckoutController | undefined
      let unsubscribe: (() => void) | undefined

      void loadInttegro()
        .then(async (inttegro) => {
          if (!active || !inttegro) return
          const instance = inttegro.createCheckout(
            definedOptions({
              ...updateOptionsRef.current,
              features: hasFeatureOverrides
                ? definedOptions({
                    allowPaymentMethodChange,
                    showInvoiceDownload,
                    showLineItems,
                    showReceiptDownload,
                  })
                : undefined,
              orderId,
              timeout,
              title,
            }),
          )
          if (!active) {
            instance.destroy()
            return
          }
          checkout = instance
          checkoutRef.current = instance
          unsubscribe = instance.onEvent((event) => {
            callbacksRef.current.onEvent?.(event)
            if (event.type === 'canceled') {
              canceled = true
              callbacksRef.current.onCanceled?.(event)
            }
            if (event.type === 'ready') callbacksRef.current.onReady?.(event)
            if (event.type === 'completed')
              callbacksRef.current.onCompleted?.(event)
            if (event.type === 'error') callbacksRef.current.onError?.(event)
          })
          if (presentation === 'modal') await instance.present()
          else await instance.mount(target!)
        })
        .catch((error: unknown) => {
          if (active && !canceled)
            callbacksRef.current.onError?.(asError(error))
        })

      return () => {
        active = false
        unsubscribe?.()
        checkout?.destroy()
        if (checkoutRef.current === checkout) checkoutRef.current = null
      }
    }, [
      allowPaymentMethodChange,
      hasFeatureOverrides,
      orderId,
      presentation,
      showInvoiceDownload,
      showLineItems,
      showReceiptDownload,
      timeout,
      title,
    ])

    useEffect(() => {
      checkoutRef.current?.update(definedOptions({ appearance, locale }))
    }, [appearance, locale])

    return <div className={className} ref={containerRef} style={style} />
  },
)

function definedOptions<Value extends object>(options: Value): Value {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Value
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Checkout failed to load.')
}

import {
  loadInttegro,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
  type CheckoutOptions,
} from '@inttegro/js'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react'

export interface CheckoutProps extends CheckoutOptions {
  className?: string
  style?: CSSProperties
  onCompleted?: (event: Extract<CheckoutEvent, { type: 'completed' }>) => void
  onError?: (event: CheckoutErrorEvent | Error) => void
  onEvent?: (event: CheckoutEvent) => void
  onReady?: (event: Extract<CheckoutEvent, { type: 'ready' }>) => void
}

export interface CheckoutHandle {
  focus(): void
  update(options: Parameters<CheckoutController['update']>[0]): void
}

export const Checkout = forwardRef<CheckoutHandle, CheckoutProps>(
  function Checkout(
    {
      appearance,
      className,
      locale,
      onCompleted,
      onError,
      onEvent,
      onReady,
      orderId,
      style,
      timeout,
      title,
    },
    forwardedRef,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const checkoutRef = useRef<CheckoutController | null>(null)
    const callbacksRef = useRef({ onCompleted, onError, onEvent, onReady })
    const updateOptionsRef = useRef({ appearance, locale })
    callbacksRef.current = { onCompleted, onError, onEvent, onReady }
    updateOptionsRef.current = { appearance, locale }

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => checkoutRef.current?.focus(),
        update: (options) => checkoutRef.current?.update(options),
      }),
      [],
    )

    useEffect(() => {
      const target = containerRef.current
      if (!target) return

      let active = true
      let checkout: CheckoutController | undefined
      let unsubscribe: (() => void) | undefined

      void loadInttegro()
        .then(async (inttegro) => {
          if (!active || !inttegro) return
          const instance = inttegro.createCheckout(
            definedOptions({
              ...updateOptionsRef.current,
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
            if (event.type === 'ready') callbacksRef.current.onReady?.(event)
            if (event.type === 'completed')
              callbacksRef.current.onCompleted?.(event)
            if (event.type === 'error') callbacksRef.current.onError?.(event)
          })
          await instance.mount(target)
        })
        .catch((error: unknown) => {
          if (active) callbacksRef.current.onError?.(asError(error))
        })

      return () => {
        active = false
        unsubscribe?.()
        checkout?.destroy()
        if (checkoutRef.current === checkout) checkoutRef.current = null
      }
    }, [orderId, timeout, title])

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

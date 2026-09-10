<script lang="ts">
  import {
    loadInttegro,
    type CheckoutController,
    type CheckoutEvent,
    type CheckoutUpdateOptions,
  } from '@inttegro/js'
  import { untrack } from 'svelte'
  import type { CheckoutProps } from './types'

  let {
    appearance,
    class: className,
    features,
    locale,
    onCanceled,
    onCompleted,
    onError,
    onEvent,
    onReady,
    orderId,
    presentation = 'embedded',
    timeout,
    title,
  }: CheckoutProps = $props()

  let container: HTMLDivElement
  let checkout = $state<CheckoutController>()

  /** Closes managed modal Checkout when it is open. */
  export function dismiss() {
    checkout?.dismiss()
  }

  /** Moves focus into Checkout when it is ready. */
  export function focus() {
    checkout?.focus()
  }

  /** Applies a new locale or theme to the active Checkout instance. */
  export function update(options: CheckoutUpdateOptions) {
    checkout?.update(options)
  }

  $effect(() => {
    const identity = { features, orderId, presentation, timeout, title }
    if (!container) return

    let active = true
    let canceled = false
    let instance: CheckoutController | undefined
    let unsubscribe: (() => void) | undefined

    void loadInttegro()
      .then(async (inttegro) => {
        if (!active || !inttegro) return
        instance = inttegro.createCheckout(
          definedOptions({
            appearance: untrack(() => appearance),
            features: identity.features,
            locale: untrack(() => locale),
            orderId: identity.orderId,
            timeout: identity.timeout,
            title: identity.title,
          }),
        )
        if (!active) {
          instance.destroy()
          return
        }
        checkout = instance
        unsubscribe = instance.onEvent((event) => {
          onEvent?.(event)
          if (event.type === 'canceled') {
            canceled = true
            onCanceled?.(event)
          }
          if (event.type === 'ready') onReady?.(event)
          if (event.type === 'completed') onCompleted?.(event)
          if (event.type === 'error') onError?.(event)
        })
        if (identity.presentation === 'modal') await instance.present()
        else await instance.mount(container)
      })
      .catch((error: unknown) => {
        if (active && !canceled) {
          onError?.(
            error instanceof Error
              ? error
              : new Error('Checkout failed to load.'),
          )
        }
      })

    return () => {
      active = false
      unsubscribe?.()
      instance?.destroy()
      if (checkout === instance) checkout = undefined
    }
  })

  $effect(() => {
    checkout?.update(definedOptions({ appearance, locale }))
  })

  function definedOptions<Value extends object>(options: Value): Value {
    return Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    ) as Value
  }
</script>

<div bind:this={container} class={className}></div>

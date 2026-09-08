<script lang="ts">
  import {
    loadInttegro,
    type CheckoutController,
    type CheckoutEvent,
  } from '@inttegro/js'
  import { untrack } from 'svelte'
  import type { CheckoutProps } from './types'

  let {
    appearance,
    class: className,
    features,
    locale,
    onCompleted,
    onError,
    onEvent,
    onReady,
    orderId,
    timeout,
    title,
  }: CheckoutProps = $props()

  let container: HTMLDivElement
  let checkout = $state<CheckoutController>()

  $effect(() => {
    const identity = { features, orderId, timeout, title }
    if (!container) return

    let active = true
    let instance: CheckoutController | undefined
    let unsubscribe: (() => void) | undefined

    void loadInttegro()
      .then(async (inttegro) => {
        if (!active || !inttegro) return
        instance = inttegro.createCheckout(
          definedOptions({
            ...identity,
            appearance: untrack(() => appearance),
            locale: untrack(() => locale),
          }),
        )
        if (!active) {
          instance.destroy()
          return
        }
        checkout = instance
        unsubscribe = instance.onEvent((event) => {
          onEvent?.(event)
          if (event.type === 'ready') onReady?.(event)
          if (event.type === 'completed') onCompleted?.(event)
          if (event.type === 'error') onError?.(event)
        })
        await instance.mount(container)
      })
      .catch((error: unknown) => {
        if (active) {
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

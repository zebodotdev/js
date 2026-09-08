import {
  loadInttegro,
  type CheckoutAppearance,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
  type CheckoutFeatures,
} from '@inttegro/js'
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue'

/**
 * Props accepted by the Inttegro {@link Checkout} component.
 *
 * Changing `features`, `orderId`, `timeout`, or `title` replaces the hosted
 * controller. Changing `appearance` or `locale` updates it in place,
 * preserving payer progress where the hosted flow permits.
 *
 * @category Vue
 */
export interface CheckoutProps {
  /** Initial and reactive theme preference for hosted Checkout. */
  appearance?: CheckoutAppearance | undefined
  /** Hosted Checkout content and actions. Changing it replaces the controller. */
  features?: CheckoutFeatures | undefined
  /** Initial and reactive BCP 47 locale preference. */
  locale?: string | undefined
  /** Client-safe reference for the finalized Order being paid. */
  orderId: string
  /** Mount timeout from 1,000–60,000 ms; defaults to 15,000 ms. */
  timeout?: number | undefined
  /** Accessible iframe title; defaults to `Checkout`. */
  title?: string | undefined
}

/**
 * Imperative operations exposed by {@link Checkout} through a Vue template ref.
 *
 * @category Vue
 */
export interface CheckoutExposed {
  /** Moves focus into Checkout when the controller is ready; otherwise does nothing. */
  focus(): void
  /** Applies a new locale or theme when a controller exists. */
  update(options: Parameters<CheckoutController['update']>[0]): void
}

/**
 * Embeds Inttegro-hosted Checkout in a Vue application.
 *
 * The component owns the loader and controller lifecycle. It emits:
 *
 * - `ready` once the iframe is interactive;
 * - `event` for every sanitized Checkout lifecycle event;
 * - `completed` at the successful hosted terminal state; and
 * - `error` for loader/mount failures or sanitized hosted errors.
 *
 * Keep the component mounted while payment or confirmation is pending. On
 * unmount it removes its event subscription and permanently destroys the
 * controller.
 *
 * @example Use native Vue events
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { Checkout, type CheckoutExposed } from '@inttegro/vue'
 *
 * const props = defineProps<{ orderId: string }>()
 * const checkout = ref<CheckoutExposed>()
 * </script>
 *
 * <template>
 *   <Checkout
 *     ref="checkout"
 *     :order-id="props.orderId"
 *     :appearance="{ theme: 'system' }"
 *     @ready="checkout?.focus()"
 *     @completed="$router.push('/orders/complete')"
 *     @error="reportCheckoutError"
 *   />
 * </template>
 * ```
 *
 * @category Vue
 */
export const Checkout = defineComponent({
  name: 'InttegroCheckout',
  props: {
    appearance: Object as PropType<CheckoutAppearance>,
    features: Object as PropType<CheckoutFeatures>,
    locale: String,
    orderId: { type: String, required: true },
    timeout: Number,
    title: String,
  },
  emits: {
    completed: (_event: Extract<CheckoutEvent, { type: 'completed' }>) => true,
    error: (_event: CheckoutErrorEvent | Error) => true,
    event: (_event: CheckoutEvent) => true,
    ready: (_event: Extract<CheckoutEvent, { type: 'ready' }>) => true,
  },
  setup(props, { emit, expose }) {
    const container = ref<HTMLElement>()
    let checkout: CheckoutController | undefined
    let unsubscribe: (() => void) | undefined
    let generation = 0

    function destroyCheckout() {
      generation += 1
      unsubscribe?.()
      unsubscribe = undefined
      checkout?.destroy()
      checkout = undefined
    }

    async function mountCheckout() {
      destroyCheckout()
      const target = container.value
      const currentGeneration = generation
      if (!target) return
      try {
        const inttegro = await loadInttegro()
        if (generation !== currentGeneration || !inttegro) return
        const instance = inttegro.createCheckout(
          definedOptions({
            appearance: props.appearance,
            features: props.features,
            locale: props.locale,
            orderId: props.orderId,
            timeout: props.timeout,
            title: props.title,
          }),
        )
        if (generation !== currentGeneration) {
          instance.destroy()
          return
        }
        checkout = instance
        unsubscribe = instance.onEvent((event) => {
          emit('event', event)
          if (event.type === 'ready') emit('ready', event)
          if (event.type === 'completed') emit('completed', event)
          if (event.type === 'error') emit('error', event)
        })
        await instance.mount(target)
      } catch (error: unknown) {
        if (generation !== currentGeneration) return
        emit(
          'error',
          error instanceof Error
            ? error
            : new Error('Checkout failed to load.'),
        )
      }
    }

    onMounted(mountCheckout)
    onBeforeUnmount(destroyCheckout)

    watch(
      () => [props.features, props.orderId, props.timeout, props.title],
      () => void mountCheckout(),
    )
    watch(
      () => [props.appearance, props.locale] as const,
      ([appearance, locale]) => {
        checkout?.update(definedOptions({ appearance, locale }))
      },
      { deep: true },
    )

    expose({
      focus: () => checkout?.focus(),
      update: (options: Parameters<CheckoutController['update']>[0]) =>
        checkout?.update(options),
    })

    return () => h('div', { ref: container })
  },
})

function definedOptions<Value extends object>(options: Value): Value {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Value
}

import {
  loadInttegro,
  type CheckoutAppearance,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
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

export const Checkout = defineComponent({
  name: 'InttegroCheckout',
  props: {
    appearance: Object as PropType<CheckoutAppearance>,
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
      () => [props.orderId, props.timeout, props.title],
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

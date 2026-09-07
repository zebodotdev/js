import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  type AfterViewInit,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
} from '@angular/core'
import {
  loadInttegro,
  type CheckoutAppearance,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
  type CheckoutUpdateOptions,
} from '@inttegro/js'

/**
 * Standalone Angular component that embeds Inttegro-hosted Checkout.
 *
 * Add the component to a host component's `imports` array. It loads the hosted
 * runtime after its view initializes, creates one controller, and destroys that
 * controller with the Angular view. Changing `orderId`, `timeout`, or `title`
 * replaces the controller; changing `appearance` or `locale` updates it in
 * place.
 *
 * Keep this component mounted while a payment attempt or confirmation is
 * pending. The successful `completed` output is suitable for navigation, but
 * fulfillment must use server-retrieved Order state or a signed webhook.
 *
 * @example
 * ```ts
 * @Component({
 *   standalone: true,
 *   imports: [CheckoutComponent],
 *   template: `
 *     <inttegro-checkout
 *       [orderId]="orderId"
 *       [appearance]="{ theme: 'system' }"
 *       (completed)="onCompleted()"
 *       (error)="onError($event)"
 *     />
 *   `,
 * })
 * export class PaymentPage {
 *   orderId = input.required<string>()
 *   onCompleted(): void { location.assign('/orders/complete') }
 *   onError(error: CheckoutErrorEvent | Error): void {
 *     reportCheckoutError(error)
 *   }
 * }
 * ```
 *
 * @category Angular
 */
@Component({
  selector: 'inttegro-checkout',
  standalone: true,
  template: '<div #container></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Initial and reactive theme preference for hosted Checkout. */
  @Input() appearance?: CheckoutAppearance
  /** Initial and reactive BCP 47 locale preference. */
  @Input() locale?: string
  /** Client-safe reference for the finalized Order being paid. */
  @Input({ required: true }) orderId = ''
  /** Mount timeout from 1,000–60,000 ms; defaults to 15,000 ms. */
  @Input() timeout?: number
  /** Accessible iframe title; defaults to `Checkout`. */
  @Input() title?: string

  /** Emitted after Checkout reports its successful terminal state. */
  @Output() readonly completed = new EventEmitter<
    Extract<CheckoutEvent, { type: 'completed' }>
  >()
  /** Emitted for loader/mount failures and sanitized hosted errors. */
  @Output() readonly error = new EventEmitter<CheckoutErrorEvent | Error>()
  /** Emitted for every sanitized hosted Checkout lifecycle event. */
  @Output() readonly event = new EventEmitter<CheckoutEvent>()
  /** Emitted once the iframe is interactive. */
  @Output() readonly ready = new EventEmitter<
    Extract<CheckoutEvent, { type: 'ready' }>
  >()

  @ViewChild('container', { static: true })
  private container?: ElementRef<HTMLDivElement>

  private checkout: CheckoutController | undefined
  private unsubscribe: (() => void) | undefined
  private viewReady = false
  private generation = 0

  ngAfterViewInit(): void {
    this.viewReady = true
    void this.mountCheckout()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return

    if (changes['orderId'] || changes['timeout'] || changes['title']) {
      void this.mountCheckout()
      return
    }

    if (changes['appearance'] || changes['locale']) {
      this.checkout?.update(
        definedOptions({ appearance: this.appearance, locale: this.locale }),
      )
    }
  }

  ngOnDestroy(): void {
    this.destroyCheckout()
  }

  /**
   * Moves focus into hosted Checkout when its controller is ready.
   * Before initialization or after teardown this method safely does nothing.
   */
  focus(): void {
    this.checkout?.focus()
  }

  /**
   * Applies a new locale or color scheme when a controller exists.
   * Prefer binding `appearance` and `locale` for declarative Angular views.
   */
  update(options: CheckoutUpdateOptions): void {
    this.checkout?.update(options)
  }

  private async mountCheckout(): Promise<void> {
    if (!this.container) return
    this.destroyCheckout()
    const generation = this.generation
    const target = this.container.nativeElement

    try {
      const inttegro = await loadInttegro()
      if (generation !== this.generation || !inttegro) return
      const checkout = inttegro.createCheckout(
        definedOptions({
          appearance: this.appearance,
          locale: this.locale,
          orderId: this.orderId,
          timeout: this.timeout,
          title: this.title,
        }),
      )
      if (generation !== this.generation) {
        checkout.destroy()
        return
      }
      this.checkout = checkout
      this.unsubscribe = checkout.onEvent((event) => {
        this.event.emit(event)
        if (event.type === 'ready') this.ready.emit(event)
        if (event.type === 'completed') this.completed.emit(event)
        if (event.type === 'error') this.error.emit(event)
      })
      await checkout.mount(target)
    } catch (error) {
      if (generation !== this.generation) return
      this.error.emit(
        error instanceof Error ? error : new Error('Checkout failed to load.'),
      )
    }
  }

  private destroyCheckout(): void {
    this.generation += 1
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.checkout?.destroy()
    this.checkout = undefined
  }
}

function definedOptions<Value extends object>(options: Value): Value {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Value
}

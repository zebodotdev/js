import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  type AfterViewInit,
} from '@angular/core'
import {
  loadInttegro,
  type CheckoutAppearance,
  type CheckoutController,
  type CheckoutErrorEvent,
  type CheckoutEvent,
  type CheckoutUpdateOptions,
} from '@inttegro/js'

@Component({
  selector: 'inttegro-checkout',
  standalone: true,
  template: '<div #container></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appearance?: CheckoutAppearance
  @Input() locale?: string
  @Input({ required: true }) orderId = ''
  @Input() timeout?: number
  @Input() title?: string

  @Output() readonly completed = new EventEmitter<
    Extract<CheckoutEvent, { type: 'completed' }>
  >()
  @Output() readonly error = new EventEmitter<CheckoutErrorEvent | Error>()
  @Output() readonly event = new EventEmitter<CheckoutEvent>()
  @Output() readonly ready = new EventEmitter<
    Extract<CheckoutEvent, { type: 'ready' }>
  >()

  @ViewChild('container', { static: true })
  private container?: ElementRef<HTMLDivElement>

  private checkout?: CheckoutController
  private unsubscribe?: () => void
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

  focus(): void {
    this.checkout?.focus()
  }

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

export type CheckoutTheme = 'light' | 'dark' | 'system'

export interface CheckoutAppearance {
  theme?: CheckoutTheme | undefined
}

export interface CheckoutOptions {
  /** Finalized Inttegro Order reference. */
  orderId: string
  /** Appearance preferences applied within the hosted checkout. */
  appearance?: CheckoutAppearance | undefined
  /** BCP 47 locale preference, such as `en-GH`. */
  locale?: string | undefined
  /** Accessible title for the hosted checkout frame. */
  title?: string | undefined
  /** Milliseconds to wait for the hosted checkout to become ready. */
  timeout?: number | undefined
}

export interface InttegroRuntime {
  /** Runtime release currently served by Inttegro. */
  readonly version: string
  /** Major checkout messaging protocol implemented by this runtime. */
  readonly protocolVersion: number
  createCheckout(options: CheckoutOptions): CheckoutController
}

export interface InttegroLoadOptions {
  /** CSP nonce copied onto the Inttegro-hosted script element. */
  nonce?: string | undefined
}

export interface CheckoutUpdateOptions {
  appearance?: CheckoutAppearance | undefined
  locale?: string | undefined
}

export type CheckoutState = 'idle' | 'mounting' | 'ready' | 'destroyed'

interface CheckoutEventBase {
  occurredAt: string
}

export interface CheckoutReadyEvent extends CheckoutEventBase {
  type: 'ready'
}

export interface CheckoutChangeEvent extends CheckoutEventBase {
  type: 'change'
  complete: boolean
  paymentMethod?: 'mobile_money' | undefined
}

export interface CheckoutPaymentAttemptEvent extends CheckoutEventBase {
  type: 'paymentAttempt'
}

export interface CheckoutConfirmationRequiredEvent extends CheckoutEventBase {
  type: 'confirmationRequired'
  kind: 'authorization' | 'code' | 'redirect'
}

export interface CheckoutPaymentAttemptFailedEvent extends CheckoutEventBase {
  type: 'paymentAttemptFailed'
  code: string
  recoverable: boolean
}

export interface CheckoutCompletedEvent extends CheckoutEventBase {
  type: 'completed'
}

export interface CheckoutCanceledEvent extends CheckoutEventBase {
  type: 'canceled'
}

export interface CheckoutErrorDetail {
  code: string
  message: string
  recoverable: boolean
}

export interface CheckoutErrorEvent extends CheckoutEventBase {
  type: 'error'
  error: CheckoutErrorDetail
}

export type CheckoutEvent =
  | CheckoutReadyEvent
  | CheckoutChangeEvent
  | CheckoutPaymentAttemptEvent
  | CheckoutConfirmationRequiredEvent
  | CheckoutPaymentAttemptFailedEvent
  | CheckoutCompletedEvent
  | CheckoutCanceledEvent
  | CheckoutErrorEvent

export type CheckoutEventType = CheckoutEvent['type']

export type CheckoutEventOfType<Type extends CheckoutEventType> = Extract<
  CheckoutEvent,
  { type: Type }
>

export type CheckoutEventHandler<Type extends CheckoutEventType> = (
  event: CheckoutEventOfType<Type>,
) => void

export interface CheckoutController {
  readonly state: CheckoutState
  mount(target: string | HTMLElement): Promise<void>
  unmount(): void
  destroy(): void
  focus(): void
  update(options: CheckoutUpdateOptions): void
  onEvent(handler: (event: CheckoutEvent) => void): () => void
  on<Type extends CheckoutEventType>(
    type: Type,
    handler: CheckoutEventHandler<Type>,
  ): () => void
}

export type InttegroCheckoutErrorCode =
  | 'already_mounted'
  | 'destroyed'
  | 'invalid_locale'
  | 'invalid_order_id'
  | 'invalid_runtime'
  | 'invalid_timeout'
  | 'mount_failed'
  | 'mount_timeout'
  | 'not_mounted'
  | 'runtime_load_failed'
  | 'runtime_load_timeout'
  | 'target_not_found'
  | 'unsupported_environment'

export class InttegroCheckoutError extends Error {
  readonly code: InttegroCheckoutErrorCode

  constructor(code: InttegroCheckoutErrorCode, message: string) {
    super(message)
    this.name = 'InttegroCheckoutError'
    this.code = code
  }
}

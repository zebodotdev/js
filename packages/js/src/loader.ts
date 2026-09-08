import { InttegroCheckoutError } from './error'
import type { InttegroLoadOptions, InttegroRuntime } from './types'

/**
 * Fixed URL of the executable Checkout runtime hosted by Inttegro.
 *
 * The npm package contains the loader, public types, and framework adapters—not
 * the payment-collection runtime. The URL is intentionally not configurable:
 * do not download, mirror, proxy, cache as your own asset, or bundle this file.
 * Allow this origin in `script-src` when your site uses Content Security Policy.
 *
 * @category Loading Checkout
 */
export const INTTEGRO_JS_URL = 'https://js.inttegro.com/inttegro.js@0.2.0'

const LOAD_TIMEOUT_MS = 15_000
const SCRIPT_MARKER = 'data-inttegro-js'
let loadPromise: Promise<InttegroRuntime | null> | undefined

/**
 * Loads and validates the Inttegro-hosted Checkout runtime.
 *
 * In a browser, the first call appends one asynchronous script from
 * {@link INTTEGRO_JS_URL}. Concurrent and subsequent calls share the same
 * promise so a page never initializes competing runtimes. If loading fails,
 * the loader removes the script it created and clears the cached promise so a
 * later user-initiated retry can try again.
 *
 * During server-side rendering, the function resolves to `null` without
 * touching the DOM. Call it from a browser lifecycle hook or explicitly guard
 * the result before creating Checkout.
 *
 * The loader accepts a pre-existing script only when its exact `src` matches
 * {@link INTTEGRO_JS_URL}; a compatible-looking `window.Inttegro` global on its
 * own is rejected. This protects the controlled-origin boundary, but does not
 * replace your own CSP, dependency review, or server-side Order authorization.
 *
 * @param options - Browser loading options. The nonce is used only when this
 * call creates the shared runtime script.
 * @returns The validated runtime in a browser, or `null` during SSR.
 * @throws {@link InttegroCheckoutError} by rejecting with
 * `invalid_runtime`, `runtime_load_failed`, or `runtime_load_timeout`.
 *
 * @example Load once in browser code and mount an Order
 * ```ts
 * const inttegro = await loadInttegro({ nonce: window.__cspNonce })
 * if (!inttegro) return // Server-side render
 *
 * const checkout = inttegro.createCheckout({ orderId })
 * checkout.on('completed', () => location.assign('/orders/complete'))
 * await checkout.mount('#checkout')
 * ```
 *
 * @category Loading Checkout
 */
export function loadInttegro(
  options: InttegroLoadOptions = {},
): Promise<InttegroRuntime | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  loadPromise ??= loadRuntime(options).catch((error: unknown) => {
    loadPromise = undefined
    throw error
  })
  return loadPromise
}

async function loadRuntime(
  options: InttegroLoadOptions,
): Promise<InttegroRuntime> {
  const existingScript = findRuntimeScript()
  if (existingScript) {
    const runtime = readRuntime()
    if (runtime) return runtime
    return waitForRuntime(existingScript, false)
  }

  if (readWindowRuntime()) {
    throw new InttegroCheckoutError(
      'invalid_runtime',
      `Inttegro was initialized without the required ${INTTEGRO_JS_URL} script.`,
    )
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.referrerPolicy = 'origin'
  script.src = INTTEGRO_JS_URL
  script.setAttribute(SCRIPT_MARKER, '0.2.0')
  if (options.nonce) script.nonce = options.nonce

  const runtime = waitForRuntime(script, true)
  document.head.append(script)
  return runtime
}

function waitForRuntime(
  script: HTMLScriptElement,
  removeOnFailure: boolean,
): Promise<InttegroRuntime> {
  return new Promise((resolve, reject) => {
    let timeout: number

    const cleanup = () => {
      window.clearTimeout(timeout)
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
    const handleLoad = () => {
      cleanup()
      try {
        resolve(requireRuntime())
      } catch (error) {
        if (removeOnFailure) script.remove()
        reject(error)
      }
    }
    const handleError = () => {
      cleanup()
      if (removeOnFailure) script.remove()
      reject(
        new InttegroCheckoutError(
          'runtime_load_failed',
          `Could not load the Inttegro-hosted JavaScript runtime from ${INTTEGRO_JS_URL}.`,
        ),
      )
    }

    timeout = window.setTimeout(() => {
      cleanup()
      if (removeOnFailure) script.remove()
      reject(
        new InttegroCheckoutError(
          'runtime_load_timeout',
          'The Inttegro-hosted JavaScript runtime did not load in time.',
        ),
      )
    }, LOAD_TIMEOUT_MS)

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
  })
}

function findRuntimeScript(): HTMLScriptElement | undefined {
  return [...document.scripts].find((script) => script.src === INTTEGRO_JS_URL)
}

function requireRuntime(): InttegroRuntime {
  const runtime = readRuntime()
  if (runtime) return runtime
  throw new InttegroCheckoutError(
    'invalid_runtime',
    'The Inttegro-hosted script loaded without a compatible runtime.',
  )
}

function readRuntime(): InttegroRuntime | undefined {
  if (!findRuntimeScript()) return undefined
  const runtime = readWindowRuntime()
  if (
    !runtime ||
    runtime.protocolVersion !== 1 ||
    typeof runtime.version !== 'string' ||
    typeof runtime.createCheckout !== 'function'
  ) {
    return undefined
  }
  return runtime
}

function readWindowRuntime(): InttegroRuntime | undefined {
  return (window as Window & { Inttegro?: InttegroRuntime }).Inttegro
}

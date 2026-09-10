import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeUrl = 'https://js.inttegro.com/inttegro.js@0.3.0'

beforeEach(() => {
  const append = document.head.append.bind(document.head)

  vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
    const scripts = nodes.filter(
      (node): node is HTMLScriptElement => node instanceof HTMLScriptElement,
    )

    for (const script of scripts) {
      script.type = 'application/x-inttegro-test'
    }

    try {
      append(...nodes)
    } finally {
      for (const script of scripts) {
        script.removeAttribute('type')
      }
    }
  })
})

afterEach(() => {
  document.head.replaceChildren()
  delete (window as Window & { Inttegro?: unknown }).Inttegro
  vi.resetModules()
})

describe('loadInttegro', () => {
  it('loads the runtime only from the fixed Inttegro origin', async () => {
    const { loadInttegro } = await import('../src/loader')
    const loaded = loadInttegro({ nonce: 'request-nonce' })
    const script = runtimeScript()

    expect(script.src).toBe(runtimeUrl)
    expect(script.async).toBe(true)
    expect(script.crossOrigin).toBe('anonymous')
    expect(script.nonce).toBe('request-nonce')
    expect(script.referrerPolicy).toBe('origin')
    expect(script.dataset.inttegroJs).toBe('0.3.0')

    const runtime = fakeRuntime()
    ;(window as Window & { Inttegro?: unknown }).Inttegro = runtime
    script.dispatchEvent(new Event('load'))

    await expect(loaded).resolves.toBe(runtime)
  })

  it('deduplicates concurrent runtime loads', async () => {
    const { loadInttegro } = await import('../src/loader')
    const first = loadInttegro()
    const second = loadInttegro()

    expect(first).toBe(second)
    expect(
      document.querySelectorAll(`script[src="${runtimeUrl}"]`),
    ).toHaveLength(1)

    const runtime = fakeRuntime()
    ;(window as Window & { Inttegro?: unknown }).Inttegro = runtime
    runtimeScript().dispatchEvent(new Event('load'))
    await expect(first).resolves.toBe(runtime)
  })

  it('rejects a runtime global that was not loaded from Inttegro', async () => {
    const { loadInttegro } = await import('../src/loader')
    ;(window as Window & { Inttegro?: unknown }).Inttegro = fakeRuntime()

    await expect(loadInttegro()).rejects.toMatchObject({
      code: 'invalid_runtime',
    })
    expect(document.scripts).toHaveLength(0)
  })

  it('removes a failed loader-created script so a retry can start cleanly', async () => {
    const { loadInttegro } = await import('../src/loader')
    const failed = loadInttegro()
    runtimeScript().dispatchEvent(new Event('error'))

    await expect(failed).rejects.toMatchObject({ code: 'runtime_load_failed' })
    expect(document.scripts).toHaveLength(0)

    const retried = loadInttegro()
    expect(document.scripts).toHaveLength(1)
    ;(window as Window & { Inttegro?: unknown }).Inttegro = fakeRuntime()
    runtimeScript().dispatchEvent(new Event('load'))
    await expect(retried).resolves.toMatchObject({ protocolVersion: 1 })
  })
})

function runtimeScript(): HTMLScriptElement {
  const script = document.querySelector<HTMLScriptElement>(
    `script[src="${runtimeUrl}"]`,
  )
  if (!script) throw new Error('Expected the Inttegro runtime script')
  return script
}

function fakeRuntime() {
  return {
    version: '0.3.0',
    protocolVersion: 1,
    createCheckout: vi.fn(),
  }
}

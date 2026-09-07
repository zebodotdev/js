# Examples

All examples assume the merchant server has already created and finalized an
Order and has supplied its client-safe `orderId` to the page.

## Inertia

Inertia is transport and routing glue rather than another component renderer.
Pass `orderId` as an Inertia page prop, then use the matching adapter:

```tsx
// React page rendered by Inertia
import { Checkout } from '@inttegro/react'

export default function PayOrder({ orderId }: { orderId: string }) {
  return <Checkout orderId={orderId} />
}
```

The same pattern applies to `@inttegro/vue` and `@inttegro/svelte`.

# `@inttegro/svelte`

Svelte adapter for Inttegro hosted workflows. The component automatically uses
`@inttegro/js` to load the executable runtime from Inttegro's fixed origin; it
does not bundle the payment-collection runtime.

```svelte
<script lang="ts">
  import { Checkout } from '@inttegro/svelte'
</script>

<Checkout {orderId} onCompleted={() => location.assign('/complete')} />
```

# `@inttegro/vue`

Vue adapter for Inttegro hosted workflows. The component automatically uses
`@inttegro/js` to load the executable runtime from Inttegro's fixed origin; it
does not bundle the payment-collection runtime.

```vue
<script setup lang="ts">
import { Checkout } from '@inttegro/vue'
</script>

<template>
  <Checkout :order-id="orderId" @completed="onCompleted" />
</template>
```

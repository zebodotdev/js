# `@inttegro/angular`

Angular adapter for Inttegro hosted workflows. The component automatically uses
`@inttegro/js` to load the executable runtime from Inttegro's fixed origin; it
does not bundle the payment-collection runtime.

```ts
import { CheckoutComponent } from '@inttegro/angular'

@Component({
  imports: [CheckoutComponent],
  template:
    '<inttegro-checkout [orderId]="orderId" (completed)="onCompleted()" />',
})
export class PaymentPage {}
```

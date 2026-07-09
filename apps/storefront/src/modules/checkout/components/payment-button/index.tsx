"use client"

import { getPaymentProviderConfig } from "@modules/checkout/components/payment-providers/registry"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton = ({ cart, "data-testid": dataTestId }: PaymentButtonProps) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]
  const providerId = paymentSession?.provider_id

  if (!providerId) {
    return <Button disabled>Select a payment method</Button>
  }

  const { PaymentButton: ProviderPaymentButton } =
    getPaymentProviderConfig(providerId)

  return (
    <ProviderPaymentButton
      cart={cart}
      notReady={notReady}
      data-testid={dataTestId}
    />
  )
}

export default PaymentButton

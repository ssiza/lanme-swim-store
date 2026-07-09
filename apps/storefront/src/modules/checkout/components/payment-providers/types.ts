import { HttpTypes } from "@medusajs/types"
import type { FC, JSX } from "react"

export type PaymentProviderType = "stripe" | "manual" | "unsupported"

export type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}

export type PaymentProviderConfig = {
  id: string
  type: PaymentProviderType
  label: string
  icon: JSX.Element
  isSupported: boolean
  PaymentButton: FC<PaymentButtonProps>
  /** Eagerly create a payment session when the customer selects this method */
  initiatesSessionOnSelect: boolean
  /** Requires Stripe card element input before continuing to review */
  requiresCardInput: boolean
  /** Checkout should wrap content in Stripe Elements when this session is active */
  requiresStripeElements: boolean
  /** Show manual payment test helper in development */
  showDevPaymentTest: boolean
}

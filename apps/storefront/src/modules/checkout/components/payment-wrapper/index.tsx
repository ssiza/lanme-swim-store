"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { getPaymentProviderConfig } from "@modules/checkout/components/payment-providers/registry"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const MissingStripeKey = () => (
  <div className="content-container py-8">
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      Stripe is selected for this cart, but{" "}
      <code className="font-mono">NEXT_PUBLIC_STRIPE_KEY</code> is missing from
      the storefront build. Set the publishable key on the storefront service,
      enable <strong>Available at Build Time</strong> in Railway, and redeploy.
    </div>
  </div>
)

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const providerConfig = getPaymentProviderConfig(paymentSession?.provider_id)

  if (providerConfig.requiresStripeElements && paymentSession) {
    if (!stripeKey || !stripePromise) {
      return <MissingStripeKey />
    }

    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper

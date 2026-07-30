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

export const isStripePublishableKeyConfigured = () => Boolean(stripeKey)

const MissingStripeKeyBanner = () => (
  <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
    Card payments need{" "}
    <code className="font-mono">NEXT_PUBLIC_STRIPE_KEY</code> on the storefront
    build. Set the Stripe publishable key, enable{" "}
    <strong>Available at Build Time</strong> in Railway, and redeploy the
    storefront. You can still choose Manual payment if it is enabled for this
    region.
  </div>
)

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const providerConfig = getPaymentProviderConfig(paymentSession?.provider_id)
  const needsStripe =
    providerConfig.requiresStripeElements && Boolean(paymentSession)
  const missingStripeKey = needsStripe && (!stripeKey || !stripePromise)

  if (needsStripe && stripeKey && stripePromise && paymentSession) {
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

  return (
    <div>
      {missingStripeKey && <MissingStripeKeyBanner />}
      {children}
    </div>
  )
}

export default PaymentWrapper

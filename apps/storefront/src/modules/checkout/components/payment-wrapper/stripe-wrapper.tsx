"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const clientSecret = paymentSession?.data?.client_secret as
    | string
    | undefined

  // Soft-fail: never crash the whole checkout tree while the payment session
  // is still propagating or cart data is briefly stale after initiate.
  if (!stripeKey || !stripePromise || !clientSecret) {
    return (
      <StripeContext.Provider value={false}>{children}</StripeContext.Provider>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper

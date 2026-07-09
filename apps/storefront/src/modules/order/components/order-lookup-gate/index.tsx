"use client"

import { verifyGuestOrderAccess, type VerifyGuestOrderState } from "@lib/data/order-access"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"
import { useActionState } from "react"

type OrderLookupGateProps = {
  orderId: string
  countryCode: string
  variant?: "verify" | "sign_in" | "wrong_account"
}

const OrderLookupGate = ({
  orderId,
  countryCode,
  variant = "verify",
}: OrderLookupGateProps) => {
  const [message, formAction] = useActionState<
    VerifyGuestOrderState,
    FormData
  >(verifyGuestOrderAccess, null)

  const title =
    variant === "wrong_account"
      ? "This order is not on your account"
      : "View your order"

  const description =
    variant === "wrong_account"
      ? "Sign in with the email used at checkout, or verify the order email below to view details."
      : variant === "sign_in"
        ? "Sign in with the email used at checkout to view full order details."
        : "Enter the email used at checkout to view your order details."

  return (
    <div className="content-container max-w-xl py-16">
      <Heading level="h1" className="text-3xl-semi mb-3">
        {title}
      </Heading>
      <Text className="text-ui-fg-subtle mb-8">{description}</Text>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <LocalizedClientLink
          href={`/account?returnTo=/${countryCode}/orders/${orderId}`}
          className="inline-flex items-center justify-center rounded-rounded bg-ui-fg-base text-ui-fg-on-color px-5 py-2.5 text-small-regular font-medium"
        >
          Sign in
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/customer-service"
          className="inline-flex items-center justify-center rounded-rounded border border-ui-border-base px-5 py-2.5 text-small-regular font-medium"
        >
          Contact customer service
        </LocalizedClientLink>
      </div>

      <div className="border-t border-ui-border-base pt-8">
        <Text className="text-base-regular mb-4">
          Guest checkout? Verify with your order email.
        </Text>
        <form action={formAction} className="flex flex-col gap-y-3">
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="country_code" value={countryCode} />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            data-testid="order-verify-email"
          />
          <ErrorMessage
            error={message?.state === "error" ? message.error : null}
            data-testid="order-verify-error"
          />
          <SubmitButton data-testid="order-verify-submit">
            Verify and view order
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}

export default OrderLookupGate

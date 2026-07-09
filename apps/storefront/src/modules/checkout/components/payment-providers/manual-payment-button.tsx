"use client"

import { placeOrder } from "@lib/data/cart"
import { Button } from "@modules/common/components/ui"
import { useState } from "react"
import ErrorMessage from "../error-message"
import { PaymentButtonProps } from "./types"

const ManualPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
}: PaymentButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId ?? "submit-order-button"}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default ManualPaymentButton

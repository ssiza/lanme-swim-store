"use client"

import { Button, Text } from "@modules/common/components/ui"
import { PaymentButtonProps } from "./types"

const UNSUPPORTED_MESSAGE = "This payment method is not available yet."

const UnsupportedPaymentButton = (_props: PaymentButtonProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button disabled size="large">
        Place order
      </Button>
      <Text className="text-small-regular text-ui-fg-subtle">
        {UNSUPPORTED_MESSAGE}
      </Text>
    </div>
  )
}

export default UnsupportedPaymentButton
export { UNSUPPORTED_MESSAGE }

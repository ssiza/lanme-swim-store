import { CreditCard } from "@medusajs/icons"
import ManualPaymentButton from "./manual-payment-button"
import { paymentInfoMap } from "./payment-info-map"
import StripePaymentButton from "./stripe-payment-button"
import UnsupportedPaymentButton, {
  UNSUPPORTED_MESSAGE,
} from "./unsupported-payment-button"
import {
  PaymentProviderConfig,
  PaymentProviderType,
} from "./types"

const resolveProviderType = (providerId: string): PaymentProviderType => {
  if (isStripeProvider(providerId)) {
    return "stripe"
  }

  if (isManualProvider(providerId)) {
    return "manual"
  }

  return "unsupported"
}

export const isStripeProvider = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") ||
    providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypalProvider = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}

export const isManualProvider = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

const buildProviderConfig = (
  providerId: string,
  type: PaymentProviderType
): PaymentProviderConfig => {
  const display = paymentInfoMap[providerId]
  const label = display?.title ?? providerId

  switch (type) {
    case "stripe":
      return {
        id: providerId,
        type,
        label,
        icon: display?.icon ?? <CreditCard />,
        isSupported: true,
        PaymentButton: StripePaymentButton,
        initiatesSessionOnSelect: true,
        requiresCardInput: true,
        requiresStripeElements: true,
        showDevPaymentTest: false,
      }
    case "manual":
      return {
        id: providerId,
        type,
        label,
        icon: display?.icon ?? <CreditCard />,
        isSupported: true,
        PaymentButton: ManualPaymentButton,
        initiatesSessionOnSelect: false,
        requiresCardInput: false,
        requiresStripeElements: false,
        showDevPaymentTest: true,
      }
    case "unsupported":
    default:
      return {
        id: providerId,
        type: "unsupported",
        label,
        icon: display?.icon ?? <CreditCard />,
        isSupported: false,
        PaymentButton: UnsupportedPaymentButton,
        initiatesSessionOnSelect: false,
        requiresCardInput: false,
        requiresStripeElements: false,
        showDevPaymentTest: false,
      }
  }
}

export const getPaymentProviderConfig = (
  providerId?: string
): PaymentProviderConfig => {
  if (!providerId) {
    return buildProviderConfig("unknown", "unsupported")
  }

  return buildProviderConfig(providerId, resolveProviderType(providerId))
}

export { paymentInfoMap, UNSUPPORTED_MESSAGE }

import {
  getPaymentProviderConfig,
  isManualProvider,
  isPaypalProvider,
  isStripeProvider,
  paymentInfoMap,
} from "@modules/checkout/components/payment-providers/registry"

// Backward-compatible re-exports for non-checkout consumers.
export { paymentInfoMap }

export const isStripeLike = isStripeProvider
export const isPaypal = isPaypalProvider
export const isManual = isManualProvider

export { getPaymentProviderConfig }

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

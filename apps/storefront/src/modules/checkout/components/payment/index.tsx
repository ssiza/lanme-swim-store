"use client"
import { RadioGroup } from "@headlessui/react"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import {
  getPaymentProviderConfig,
  UNSUPPORTED_MESSAGE,
} from "@modules/checkout/components/payment-providers/registry"
import { isStripePublishableKeyConfigured } from "@modules/checkout/components/payment-wrapper"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const autoInitRef = useRef<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"
  const selectedProviderConfig = getPaymentProviderConfig(selectedPaymentMethod)
  const activeProviderConfig = getPaymentProviderConfig(
    activeSession?.provider_id
  )
  const stripeKeyConfigured = isStripePublishableKeyConfigured()

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setCardComplete(false)
    setCardBrand(null)
    setSelectedPaymentMethod(method)
    setIsLoading(true)

    try {
      const providerConfig = getPaymentProviderConfig(method)

      if (
        providerConfig.requiresStripeElements &&
        !stripeKeyConfigured
      ) {
        setError(
          "Stripe card payments are unavailable: NEXT_PUBLIC_STRIPE_KEY is missing from the storefront build. Choose Manual payment, or redeploy the storefront with the publishable key available at build time."
        )
        return
      }

      if (providerConfig.initiatesSessionOnSelect) {
        await initiatePaymentSession(cart, {
          provider_id: method,
        })
        // Refresh so PaymentWrapper receives the client_secret and mounts Stripe Elements.
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!selectedProviderConfig.isSupported) {
        setError(UNSUPPORTED_MESSAGE)
        return
      }

      if (!selectedPaymentMethod && !paidByGiftcard) {
        setError("Please select a payment method")
        return
      }

      if (
        selectedProviderConfig.requiresStripeElements &&
        !stripeKeyConfigured
      ) {
        setError(
          "Stripe card payments are unavailable on this storefront build. Choose Manual payment or redeploy with NEXT_PUBLIC_STRIPE_KEY."
        )
        return
      }

      if (
        selectedProviderConfig.requiresCardInput &&
        !cardComplete &&
        !paidByGiftcard
      ) {
        setError("Please enter your card details")
        return
      }

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession && selectedPaymentMethod) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
        router.refresh()
      }

      return router.push(
        pathname + "?" + createQueryString("step", "review"),
        {
          scroll: false,
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Keep local selection in sync when cart gains an active session after refresh.
  useEffect(() => {
    if (activeSession?.provider_id && !selectedPaymentMethod) {
      setSelectedPaymentMethod(activeSession.provider_id)
    }
  }, [activeSession?.provider_id, selectedPaymentMethod])

  // Prefer a ready payment method when the payment step opens so customers are
  // not stuck with an empty selection (especially when Stripe is the only option).
  useEffect(() => {
    if (!isOpen || paidByGiftcard || selectedPaymentMethod) {
      return
    }

    const preferred =
      availablePaymentMethods.find((method) => {
        const config = getPaymentProviderConfig(method.id)
        if (!config.isSupported) {
          return false
        }
        if (config.requiresStripeElements && !stripeKeyConfigured) {
          return false
        }
        return true
      }) ?? availablePaymentMethods.find((method) =>
        getPaymentProviderConfig(method.id).isSupported
      )

    if (!preferred) {
      return
    }

    if (autoInitRef.current === preferred.id) {
      return
    }

    autoInitRef.current = preferred.id
    void setPaymentMethod(preferred.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run when the payment step opens
  }, [
    isOpen,
    paidByGiftcard,
    selectedPaymentMethod,
    availablePaymentMethods,
    stripeKeyConfigured,
  ])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length ? (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => {
                  const providerConfig = getPaymentProviderConfig(
                    paymentMethod.id
                  )
                  const stripeUnavailable =
                    providerConfig.requiresStripeElements &&
                    !stripeKeyConfigured

                  if (providerConfig.type === "stripe") {
                    return (
                      <div key={paymentMethod.id}>
                        <StripeCardContainer
                          paymentProviderId={paymentMethod.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                          setCardBrand={setCardBrand}
                          setError={setError}
                          setCardComplete={setCardComplete}
                          disabled={stripeUnavailable}
                        />
                        {stripeUnavailable &&
                          selectedPaymentMethod === paymentMethod.id && (
                            <Text className="text-small-regular text-ui-fg-subtle mb-2 px-1">
                              Stripe publishable key is missing from this
                              storefront build, so the card form cannot load.
                            </Text>
                          )}
                      </div>
                    )
                  }

                  return (
                    <div key={paymentMethod.id}>
                      <PaymentContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        disabled={!providerConfig.isSupported}
                      >
                        {!providerConfig.isSupported && (
                          <Text className="text-small-regular text-ui-fg-subtle mt-2">
                            {UNSUPPORTED_MESSAGE}
                          </Text>
                        )}
                      </PaymentContainer>
                    </div>
                  )
                })}
              </RadioGroup>
            </>
          ) : (
            !paidByGiftcard && (
              <Text className="txt-medium text-ui-fg-subtle mb-4">
                No payment methods are available for this region. Enable Stripe
                (or Manual) under Admin → Settings → Regions, then refresh
                checkout.
              </Text>
            )
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (!paidByGiftcard &&
                (!selectedPaymentMethod ||
                  !selectedProviderConfig.isSupported ||
                  (selectedProviderConfig.requiresStripeElements &&
                    !stripeKeyConfigured) ||
                  (selectedProviderConfig.requiresCardInput &&
                    stripeKeyConfigured &&
                    !cardComplete))) ||
              isLoading
            }
            data-testid="submit-payment-button"
          >
            {selectedProviderConfig.requiresCardInput &&
            stripeKeyConfigured &&
            !cardComplete
              ? "Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {activeProviderConfig.label}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {activeProviderConfig.icon || <CreditCard />}
                  </Container>
                  <Text>
                    {activeProviderConfig.requiresCardInput && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment

import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { Text } from "@modules/common/components/ui"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const [shippingMethods, paymentMethods] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
  ])

  // `listCartShippingMethods` returns null only when the request itself failed.
  // That is expected on the first render of a brand new cart, because Medusa
  // rejects /store/shipping-options until the cart has the context it needs
  // (sales channel, region, currency, delivery address). Bailing out here used
  // to replace the ENTIRE checkout - address form included - with an error, so
  // the customer had no way to supply the address that would have made the
  // request succeed. Refreshing could never fix it. Render the form regardless
  // and let the delivery step report its own state.
  const shippingMethodsUnavailable = shippingMethods === null

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      {shippingMethodsUnavailable && (
        <Text className="txt-medium text-ui-fg-subtle">
          We couldn&apos;t load delivery options yet. Enter your shipping
          address below and they&apos;ll appear at the delivery step.
        </Text>
      )}

      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods ?? []} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods ?? []} />

      <Review cart={cart} />
    </div>
  )
}

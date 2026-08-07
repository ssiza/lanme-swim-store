"use server"

import { sdk } from "@lib/config"
import { logFetchEnd, logFetchError } from "@lib/util/storefront-fetch-log"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "./cookies"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  // Checkout shipping options depend on the current cart address/region, so
  // this request is always uncached. Cache tags are deliberately NOT passed:
  // they are dead weight next to `cache: "no-store"` and only obscure intent.
  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(({ shipping_options }) => {
      logFetchEnd("listCartShippingMethods", {
        cartId,
        count: shipping_options?.length ?? 0,
      })
      return shipping_options
    })
    .catch((error) => {
      // Do not swallow this. When the cart is missing a sales channel, region
      // or currency, Medusa rejects /store/shipping-options outright, and a
      // silent null used to look identical to "no options for this address".
      logFetchError("listCartShippingMethods", error, { cartId })
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        cache: "no-store",
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((error) => {
      logFetchError("calculatePriceForShippingOption", error, {
        optionId,
        cartId,
      })
      return null
    })
}

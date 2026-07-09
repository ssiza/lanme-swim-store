"use server"

import { sdk } from "@lib/config"
import {
  getOrderAccessToken,
  setOrderAccessToken,
} from "./cookies"
import { retrieveCustomer } from "./customer"
import { retrieveOrder } from "./orders"
import { logOrderAccess } from "@lib/util/order-access-log"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"

export type OrderAccessRenderState =
  | "full"
  | "sign_in"
  | "verify"
  | "not_found"
  | "wrong_account"

export type OrderAccessResult =
  | {
      state: "full"
      order: HttpTypes.StoreOrder
    }
  | {
      state: Exclude<OrderAccessRenderState, "full">
      orderId: string
    }

const customerOwnsOrder = (
  order: HttpTypes.StoreOrder,
  customer: HttpTypes.StoreCustomer
) => {
  if (order.customer_id && customer.id) {
    return order.customer_id === customer.id
  }

  if (order.email && customer.email) {
    return order.email.trim().toLowerCase() === customer.email.trim().toLowerCase()
  }

  return false
}

const fetchOrderWithAccessToken = async (
  orderId: string,
  accessToken: string
) => {
  return sdk.client
    .fetch<{ order: HttpTypes.StoreOrder }>(`/store/orders/${orderId}/access`, {
      method: "GET",
      headers: {
        "x-order-access-token": accessToken,
      },
      cache: "no-store",
    })
    .then(({ order }) => order)
    .catch(() => null)
}

export const resolveOrderAccess = async (
  orderId: string,
  countryCode: string
): Promise<OrderAccessResult> => {
  const route = `/${countryCode}/orders/${orderId}`
  const customer = await retrieveCustomer()
  const isAuthenticated = Boolean(customer)
  const accessToken = await getOrderAccessToken(orderId)

  if (accessToken) {
    const verifiedOrder = await fetchOrderWithAccessToken(orderId, accessToken)

    if (verifiedOrder) {
      logOrderAccess({
        order_id: orderId,
        route,
        auth_state: isAuthenticated ? "authenticated" : "guest",
        order_exists: true,
        customer_owns_order: customer
          ? customerOwnsOrder(verifiedOrder, customer)
          : undefined,
        render_state: "full",
      })

      return { state: "full", order: verifiedOrder }
    }
  }

  if (isAuthenticated && customer) {
    try {
      const order = await retrieveOrder(orderId)
      const ownsOrder = customerOwnsOrder(order, customer)

      if (ownsOrder) {
        logOrderAccess({
          order_id: orderId,
          route,
          auth_state: "authenticated",
          order_exists: true,
          customer_owns_order: true,
          render_state: "full",
        })

        return { state: "full", order }
      }

      logOrderAccess({
        order_id: orderId,
        route,
        auth_state: "authenticated",
        order_exists: true,
        customer_owns_order: false,
        render_state: "wrong_account",
      })

      return { state: "wrong_account", orderId }
    } catch {
      logOrderAccess({
        order_id: orderId,
        route,
        auth_state: "authenticated",
        order_exists: false,
        customer_owns_order: false,
        render_state: "not_found",
      })

      return { state: "not_found", orderId }
    }
  }

  logOrderAccess({
    order_id: orderId,
    route,
    auth_state: "guest",
    order_exists: "unknown",
    render_state: "verify",
  })

  return { state: "verify", orderId }
}

export type VerifyGuestOrderState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

export async function verifyGuestOrderAccess(
  _currentState: VerifyGuestOrderState,
  formData: FormData
): Promise<VerifyGuestOrderState> {
  const orderId = formData.get("order_id") as string
  const email = formData.get("email") as string
  const countryCode = formData.get("country_code") as string

  if (!orderId || !email) {
    return { state: "error", error: "Order ID and email are required." }
  }

  try {
    const response = await sdk.client.fetch<{
      access_token: string
      order_id: string
    }>("/store/orders/verify", {
      method: "POST",
      body: {
        order_id: orderId,
        email,
      },
      cache: "no-store",
    })

    await setOrderAccessToken(orderId, response.access_token)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed."

    if (message.toLowerCase().includes("not found")) {
      redirect(`/${countryCode}/orders/${orderId}?status=not_found`)
    }

    return {
      state: "error",
      error:
        "We could not verify that order. Check the email used at checkout and try again.",
    }
  }

  redirect(`/${countryCode}/orders/${orderId}`)
}

export async function retrieveOwnedOrderForAccount(orderId: string) {
  const customer = await retrieveCustomer()

  if (!customer) {
    return null
  }

  const order = await retrieveOrder(orderId).catch(() => null)

  if (!order || !customerOwnsOrder(order, customer)) {
    return null
  }

  return order
}

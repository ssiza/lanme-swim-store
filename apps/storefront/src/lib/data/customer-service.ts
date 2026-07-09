"use server"

import { sdk } from "@lib/config"
import { FetchError } from "@medusajs/js-sdk"

export type CustomerServiceFormState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

export async function submitCustomerServiceRequest(
  _prevState: CustomerServiceFormState,
  formData: FormData
): Promise<CustomerServiceFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const orderNumber = String(formData.get("order_number") ?? "").trim()
  const topic = String(formData.get("topic") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()

  if (!name || !email || !topic || !message) {
    return {
      state: "error",
      error: "Please fill in all required fields.",
    }
  }

  try {
    await sdk.client.fetch(`/store/customer-service`, {
      method: "POST",
      body: {
        name,
        email,
        topic,
        message,
        ...(orderNumber ? { order_number: orderNumber } : {}),
      },
    })

    return { state: "success" }
  } catch (error) {
    if (error instanceof FetchError) {
      const status = error.status

      if (status === 429) {
        return {
          state: "error",
          error:
            "Too many requests from this email. Please try again in about an hour.",
        }
      }

      const apiMessage =
        typeof error.message === "string" && error.message.length > 0
          ? error.message
          : null

      if (apiMessage) {
        return { state: "error", error: apiMessage }
      }
    }

    return { state: "error", error: "Something went wrong. Please try again." }
  }
}

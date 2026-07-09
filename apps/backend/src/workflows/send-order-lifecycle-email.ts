import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { buildAccountUrl, buildOrderUrl } from "../lib/storefront-urls"
import { sendNotificationStep } from "./steps/send-notification"

export type OrderLifecycleEmailTemplate =
  | "order-fulfillment-preparing"
  | "order-shipped"
  | "order-delivered"

export type OrderLifecycleEmailInput = {
  event_name: string
  template: OrderLifecycleEmailTemplate
  order_id: string
  fulfillment_id?: string | null
  display_id?: number | string | null
  email?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

const idempotencyKeyFor = (input: OrderLifecycleEmailInput) => {
  const fulfillmentPart = input.fulfillment_id ?? "order"

  return `${input.template}-${input.order_id}-${fulfillmentPart}`
}

export const sendOrderLifecycleEmailWorkflow = createWorkflow(
  "send-order-lifecycle-email",
  (input: OrderLifecycleEmailInput) => {
    const notifications = transform({ input }, ({ input }) => {
      if (!input.email) {
        return []
      }

      return [
        {
          to: input.email,
          channel: "email",
          template: input.template,
          idempotency_key: idempotencyKeyFor(input),
          data: {
            event_name: input.event_name,
            order_id: input.order_id,
            fulfillment_id: input.fulfillment_id,
            display_id: input.display_id,
            email: input.email,
            tracking_number: input.tracking_number,
            tracking_url: input.tracking_url,
            order_url: buildOrderUrl(input.order_id),
            account_url: buildAccountUrl(),
          },
        },
      ]
    })

    const notification = when({ input }, (data) => !!data.input.email).then(() =>
      sendNotificationStep(notifications)
    )

    return new WorkflowResponse({
      notification,
    })
  }
)

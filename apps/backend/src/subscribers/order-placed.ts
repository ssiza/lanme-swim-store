import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrderPlacedAdminFeedNotification } from "../lib/admin-feed-notification"
import { logOrderEmailEvent } from "../lib/order-email-log"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await createOrderPlacedAdminFeedNotification(container, data.id)
  } catch (error) {
    logOrderEmailEvent(logger, {
      event_name: "order.placed",
      order_id: data.id,
      template: "admin-ui",
      error_message: error instanceof Error ? error.message : String(error),
    })
  }

  if (!process.env.RESEND_API_KEY) {
    logOrderEmailEvent(logger, {
      event_name: "order.placed",
      order_id: data.id,
      template: "order-placed",
      skipped: true,
      skip_reason: "RESEND_API_KEY not configured",
    })
    return
  }

  try {
    await sendOrderConfirmationWorkflow(container).run({
      input: {
        id: data.id,
      },
    })

    logOrderEmailEvent(logger, {
      event_name: "order.placed",
      order_id: data.id,
      template: "order-placed",
      provider_response: "workflow_completed",
    })
  } catch (error) {
    logOrderEmailEvent(logger, {
      event_name: "order.placed",
      order_id: data.id,
      template: "order-placed",
      error_message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  loadOrderEmailContextByFulfillmentId,
  loadOrderEmailContextByOrderId,
} from "./order-email-context"
import { logOrderEmailEvent } from "./order-email-log"
import {
  createAdminFeedNotification,
  buildAdminOrderUrl,
} from "./admin-feed-notification"
import {
  sendOrderLifecycleEmailWorkflow,
  type OrderLifecycleEmailTemplate,
} from "../workflows/send-order-lifecycle-email"

type LifecycleSubscriberInput = {
  eventName: string
  template: OrderLifecycleEmailTemplate
  container: Lanme SwimContainer
  no_notification?: boolean
  order_id?: string
  fulfillment_id?: string
}

const lifecycleTitles: Record<OrderLifecycleEmailTemplate, string> = {
  "order-fulfillment-preparing": "is being prepared",
  "order-shipped": "has shipped",
  "order-delivered": "was delivered",
}

export async function handleOrderLifecycleEmail({
  eventName,
  template,
  container,
  no_notification,
  order_id,
  fulfillment_id,
}: LifecycleSubscriberInput) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (no_notification) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id,
      fulfillment_id,
      template,
      skipped: true,
      skip_reason: "no_notification=true",
    })
    return
  }

  const context = order_id
    ? await loadOrderEmailContextByOrderId(
        container,
        order_id,
        fulfillment_id ?? null
      )
    : fulfillment_id
      ? await loadOrderEmailContextByFulfillmentId(container, fulfillment_id)
      : null

  if (!context?.order_id) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id,
      fulfillment_id,
      template,
      skipped: true,
      skip_reason: "order context not found",
    })
    return
  }

  const orderLabel = context.display_id
    ? `#${context.display_id}`
    : context.order_id

  try {
    await createAdminFeedNotification(container, {
      idempotency_key: `${template}-feed-${context.order_id}-${context.fulfillment_id ?? "order"}`,
      title: `Order ${orderLabel} ${lifecycleTitles[template]}`,
      description: context.email
        ? `Order update for ${context.email}.`
        : "Order status updated.",
      data: {
        order_id: context.order_id,
        fulfillment_id: context.fulfillment_id,
        admin_url: buildAdminOrderUrl(context.order_id),
      },
    })
  } catch (error) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id: context.order_id,
      fulfillment_id: context.fulfillment_id,
      template: "admin-ui",
      error_message: error instanceof Error ? error.message : String(error),
    })
  }

  if (!process.env.RESEND_API_KEY) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id: context.order_id,
      fulfillment_id: context.fulfillment_id,
      template,
      skipped: true,
      skip_reason: "RESEND_API_KEY not configured",
    })
    return
  }

  if (!context.email) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id: context.order_id,
      fulfillment_id: context.fulfillment_id,
      template,
      skipped: true,
      skip_reason: "order has no email",
    })
    return
  }

  try {
    await sendOrderLifecycleEmailWorkflow(container).run({
      input: {
        event_name: eventName,
        template,
        order_id: context.order_id,
        fulfillment_id: context.fulfillment_id,
        display_id: context.display_id,
        email: context.email,
        tracking_number: context.tracking_number,
        tracking_url: context.tracking_url,
      },
    })

    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id: context.order_id,
      fulfillment_id: context.fulfillment_id,
      recipient_email: context.email,
      template,
      provider_response: "workflow_completed",
    })
  } catch (error) {
    logOrderEmailEvent(logger, {
      event_name: eventName,
      order_id: context.order_id,
      fulfillment_id: context.fulfillment_id,
      recipient_email: context.email,
      template,
      error_message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

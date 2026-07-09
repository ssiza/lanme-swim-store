import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createAdminFeedNotification } from "../lib/admin-feed-notification"
import {
  formatSupportTopic,
  getCustomerServiceAdminEmail,
} from "../lib/customer-service"
import { buildAdminCustomerServiceTicketUrl } from "../lib/storefront-urls"
import { CUSTOMER_SERVICE_MODULE } from "../modules/customer-service"
import type { SupportTopic } from "../modules/customer-service/constants"
import type CustomerServiceModuleService from "../modules/customer-service/service"

export default async function supportTicketCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerService = container.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModuleService

  const ticket = await customerService.retrieveSupportTicket(data.id)
  const topicLabel = formatSupportTopic(ticket.topic as SupportTopic)

  await createAdminFeedNotification(container, {
    idempotency_key: `support-ticket-feed-${ticket.id}`,
    title: `Support request: ${topicLabel}`,
    description: `${ticket.name} (${ticket.email}) submitted a customer service request.`,
    data: {
      ticket_id: ticket.id,
      admin_url: buildAdminCustomerServiceTicketUrl(ticket.id),
    },
  })

  if (!process.env.RESEND_API_KEY) {
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: ticket.email,
    channel: "email",
    template: "support-ticket-confirmation",
    idempotency_key: `support-ticket-confirmation-${ticket.id}`,
    data: {
      name: ticket.name,
      email: ticket.email,
      topic_label: topicLabel,
      message: ticket.message,
      order_number: ticket.order_display_id,
      ticket_id: ticket.id,
    },
  })

  const adminEmail = getCustomerServiceAdminEmail()

  if (!adminEmail) {
    return
  }

  await notificationModuleService.createNotifications({
    to: adminEmail,
    channel: "email",
    template: "support-ticket-admin-notification",
    idempotency_key: `support-ticket-admin-notification-${ticket.id}`,
    data: {
      name: ticket.name,
      email: ticket.email,
      topic_label: topicLabel,
      message: ticket.message,
      order_number: ticket.order_display_id,
      ticket_id: ticket.id,
      admin_url: buildAdminCustomerServiceTicketUrl(ticket.id),
      subject: `New support request: ${topicLabel}`,
    },
  })
}

export const config: SubscriberConfig = {
  event: "support-ticket.created",
}

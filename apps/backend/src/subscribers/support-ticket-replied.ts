import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { formatSupportTopic } from "../lib/customer-service"
import { CUSTOMER_SERVICE_MODULE } from "../modules/customer-service"
import type { SupportTopic } from "../modules/customer-service/constants"
import type CustomerServiceModuleService from "../modules/customer-service/service"

export default async function supportTicketRepliedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reply_id: string }>) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const customerService = container.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModuleService & {
    retrieveSupportTicketReply: (id: string) => Promise<{
      id: string
      message: string
    }>
  }

  const ticket = await customerService.retrieveSupportTicket(data.id)
  const reply = await customerService.retrieveSupportTicketReply(data.reply_id)
  const topicLabel = formatSupportTopic(ticket.topic as SupportTopic)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: ticket.email,
    channel: "email",
    template: "support-ticket-reply",
    idempotency_key: `support-ticket-reply-${reply.id}`,
    data: {
      name: ticket.name,
      email: ticket.email,
      topic_label: topicLabel,
      reply_message: reply.message,
      ticket_id: ticket.id,
      subject: `Re: ${topicLabel} support request`,
    },
  })
}

export const config: SubscriberConfig = {
  event: "support-ticket.replied",
}

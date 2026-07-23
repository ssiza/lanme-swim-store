import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  MAX_TICKETS_PER_EMAIL_PER_HOUR,
  SUPPORT_TOPIC_LABELS,
  type SupportTopic,
} from "../modules/customer-service/constants"

export function formatSupportTopic(topic: SupportTopic) {
  return SUPPORT_TOPIC_LABELS[topic] ?? topic
}

export function getCustomerServiceAdminEmail() {
  return (
    process.env.CUSTOMER_SERVICE_ADMIN_EMAIL ||
    process.env.RESEND_REPLY_TO ||
    process.env.RESEND_FROM_EMAIL ||
    null
  )
}

export async function resolveOrderReference(
  container: Lanme SwimContainer,
  orderNumber?: string | null
): Promise<{ order_id: string | null; order_display_id: string | null }> {
  const trimmed = orderNumber?.trim()

  if (!trimmed) {
    return { order_id: null, order_display_id: null }
  }

  const normalized = trimmed.replace(/^#/, "")
  const displayId = Number.parseInt(normalized, 10)

  if (!Number.isNaN(displayId)) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id"],
      filters: {
        display_id: String(displayId),
      },
    })

    const order = orders?.[0]

    if (order?.id) {
      return {
        order_id: order.id,
        order_display_id: String(order.display_id ?? displayId),
      }
    }
  }

  return {
    order_id: null,
    order_display_id: normalized,
  }
}

export async function countRecentTicketsForEmail(
  container: Lanme SwimContainer,
  email: string
) {
  const customerService = container.resolve("customer_service") as {
    listSupportTickets: (
      filters?: Record<string, unknown>
    ) => Promise<Array<{ created_at?: string | Date }>>
  }

  const since = new Date(Date.now() - 60 * 60 * 1000)
  const tickets = await customerService.listSupportTickets({ email })

  return tickets.filter((ticket) => {
    if (!ticket.created_at) {
      return false
    }

    return new Date(ticket.created_at) >= since
  }).length
}

export async function assertTicketSubmissionAllowed(
  container: Lanme SwimContainer,
  email: string
) {
  const recentCount = await countRecentTicketsForEmail(container, email)

  if (recentCount >= MAX_TICKETS_PER_EMAIL_PER_HOUR) {
    const error = new Error(
      "Too many support requests from this email. Please try again later."
    )
    ;(error as Error & { statusCode?: number }).statusCode = 429
    throw error
  }
}

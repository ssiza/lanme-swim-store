import type { Lanme SwimRequest, Lanme SwimResponse } from "@medusajs/framework/http"
import { CUSTOMER_SERVICE_MODULE } from "../../../modules/customer-service"
import type CustomerServiceModuleService from "../../../modules/customer-service/service"
import type { SupportStatus } from "../../../modules/customer-service/constants"

type CustomerServiceModule = CustomerServiceModuleService & {
  listSupportTicketReplies: (
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<
    Array<{
      id: string
      ticket_id: string
      admin_user_id?: string | null
      message: string
      created_at?: string | Date
    }>
  >
}

export async function loadTicketWithReplies(
  customerService: CustomerServiceModule,
  id: string
) {
  const ticket = await customerService.retrieveSupportTicket(id)

  const replies = await customerService.listSupportTicketReplies(
    { ticket_id: id },
    { order: { created_at: "ASC" } }
  )

  return {
    ticket,
    replies,
  }
}

export type { CustomerServiceModule }

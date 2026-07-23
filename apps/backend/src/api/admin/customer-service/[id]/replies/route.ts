import type {
  AuthenticatedLanme SwimRequest,
  Lanme SwimRequest,
  Lanme SwimResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CUSTOMER_SERVICE_MODULE } from "../../../../../modules/customer-service"
import type { AdminCreateCustomerServiceReplyType } from "../../validators"
import { loadTicketWithReplies, type CustomerServiceModule } from "../../lib"

export async function POST(
  req: AuthenticatedLanme SwimRequest,
  res: Lanme SwimResponse
) {
  const { id } = req.params
  const body = req.validatedBody as AdminCreateCustomerServiceReplyType
  const customerService = req.scope.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModule

  await customerService.retrieveSupportTicket(id)

  const adminUserId = req.auth_context?.actor_id ?? null

  const reply = await customerService.createSupportTicketReplies({
    ticket_id: id,
    admin_user_id: adminUserId,
    message: body.message,
  })

  await customerService.updateSupportTickets({
    id,
    status: "replied",
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)

  await eventBus.emit({
    name: "support-ticket.replied",
    data: {
      id,
      reply_id: reply.id,
    },
  })

  const payload = await loadTicketWithReplies(customerService, id)

  res.status(201).json(payload)
}

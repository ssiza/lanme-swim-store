import type { Lanme SwimRequest, Lanme SwimResponse } from "@medusajs/framework/http"
import { CUSTOMER_SERVICE_MODULE } from "../../../../modules/customer-service"
import type { AdminUpdateCustomerServiceTicketType } from "../validators"
import { loadTicketWithReplies, type CustomerServiceModule } from "../lib"

export async function GET(req: Lanme SwimRequest, res: Lanme SwimResponse) {
  const { id } = req.params
  const customerService = req.scope.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModule

  const payload = await loadTicketWithReplies(customerService, id)

  res.json(payload)
}

export async function PATCH(req: Lanme SwimRequest, res: Lanme SwimResponse) {
  const { id } = req.params
  const body = req.validatedBody as AdminUpdateCustomerServiceTicketType
  const customerService = req.scope.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModule

  await customerService.updateSupportTickets({
    id,
    status: body.status,
  })

  const payload = await loadTicketWithReplies(customerService, id)

  res.json(payload)
}

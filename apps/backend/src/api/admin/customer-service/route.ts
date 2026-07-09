import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOMER_SERVICE_MODULE } from "../../../modules/customer-service"
import type { SupportStatus } from "../../../modules/customer-service/constants"
import type { CustomerServiceModule } from "./lib"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerService = req.scope.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModule

  const status = req.query.status as SupportStatus | undefined
  const limit = Math.min(Number(req.query.limit) || 50, 100)
  const offset = Number(req.query.offset) || 0

  const filters = status ? { status } : {}

  const [tickets, count] = await customerService.listAndCountSupportTickets(
    filters,
    {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    tickets,
    count,
    offset,
    limit,
  })
}

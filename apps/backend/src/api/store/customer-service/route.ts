import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  assertTicketSubmissionAllowed,
  resolveOrderReference,
} from "../../../lib/customer-service"
import { CUSTOMER_SERVICE_MODULE } from "../../../modules/customer-service"
import type CustomerServiceModuleService from "../../../modules/customer-service/service"
import type { StoreCreateCustomerServiceTicketType } from "./validators"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.validatedBody as StoreCreateCustomerServiceTicketType
  const customerService = req.scope.resolve(
    CUSTOMER_SERVICE_MODULE
  ) as CustomerServiceModuleService

  try {
    await assertTicketSubmissionAllowed(req.scope, body.email)
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 429

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      error instanceof Error ? error.message : "Too many requests"
    )
  }

  const orderReference = await resolveOrderReference(
    req.scope,
    body.order_number
  )

  const ticket = await customerService.createSupportTickets({
    name: body.name,
    email: body.email,
    order_id: orderReference.order_id,
    order_display_id: orderReference.order_display_id,
    topic: body.topic,
    message: body.message,
    status: "open",
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)

  await eventBus.emit({
    name: "support-ticket.created",
    data: {
      id: ticket.id,
    },
  })

  res.status(201).json({
    ticket: {
      id: ticket.id,
    },
    message: "Your request has been sent. We'll reply by email.",
  })
}

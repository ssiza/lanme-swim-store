import { z } from "zod"
import { SUPPORT_STATUSES } from "../../../modules/customer-service/constants"

export const AdminUpdateCustomerServiceTicket = z.object({
  status: z.enum(SUPPORT_STATUSES),
})

export const AdminCreateCustomerServiceReply = z.object({
  message: z.string().trim().min(1, "Reply message is required").max(5000),
})

export type AdminUpdateCustomerServiceTicketType = z.infer<
  typeof AdminUpdateCustomerServiceTicket
>

export type AdminCreateCustomerServiceReplyType = z.infer<
  typeof AdminCreateCustomerServiceReply
>

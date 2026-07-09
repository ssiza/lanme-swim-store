import { z } from "zod"
import { SUPPORT_STATUSES, SUPPORT_TOPICS } from "../../../modules/customer-service/constants"

export const StoreCreateCustomerServiceTicket = z.object({
  name: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("A valid email is required").max(320),
  order_number: z.string().trim().max(100).optional().nullable(),
  topic: z.enum(SUPPORT_TOPICS),
  message: z.string().trim().min(1, "Message is required").max(5000),
})

export const AdminUpdateCustomerServiceTicket = z.object({
  status: z.enum(SUPPORT_STATUSES),
})

export const AdminCreateCustomerServiceReply = z.object({
  message: z.string().trim().min(1, "Reply message is required").max(5000),
})

export type StoreCreateCustomerServiceTicketType = z.infer<
  typeof StoreCreateCustomerServiceTicket
>

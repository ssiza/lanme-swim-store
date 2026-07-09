import { z } from "zod"

export const StoreVerifyOrderAccess = z.object({
  order_id: z.string().trim().min(1, "Order ID is required"),
  email: z.string().trim().email("A valid email is required").max(320),
})

export type StoreVerifyOrderAccessType = z.infer<typeof StoreVerifyOrderAccess>

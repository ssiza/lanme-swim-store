import { MedusaService } from "@medusajs/framework/utils"
import SupportTicket from "./models/support-ticket"
import SupportTicketReply from "./models/support-ticket-reply"

class CustomerServiceModuleService extends MedusaService({
  SupportTicket,
  SupportTicketReply,
}) {}

export default CustomerServiceModuleService

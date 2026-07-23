import { Lanme SwimService } from "@medusajs/framework/utils"
import SupportTicket from "./models/support-ticket"
import SupportTicketReply from "./models/support-ticket-reply"

class CustomerServiceModuleService extends Lanme SwimService({
  SupportTicket,
  SupportTicketReply,
}) {}

export default CustomerServiceModuleService

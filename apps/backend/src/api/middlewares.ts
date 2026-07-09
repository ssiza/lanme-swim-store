import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { StoreCreateCustomerServiceTicket } from "./store/customer-service/validators"
import { StoreVerifyOrderAccess } from "./store/orders/verify/validators"
import {
  AdminCreateCustomerServiceReply,
  AdminUpdateCustomerServiceTicket,
} from "./admin/customer-service/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/customer-service",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(StoreCreateCustomerServiceTicket),
      ],
    },
    {
      matcher: "/store/orders/verify",
      method: ["POST"],
      middlewares: [validateAndTransformBody(StoreVerifyOrderAccess)],
    },
    {
      matcher: "/admin/customer-service*",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"]),
      ],
    },
    {
      matcher: "/admin/customer-service/:id",
      method: ["PATCH"],
      middlewares: [
        validateAndTransformBody(AdminUpdateCustomerServiceTicket),
      ],
    },
    {
      matcher: "/admin/customer-service/:id/replies",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(AdminCreateCustomerServiceReply),
      ],
    },
  ],
})

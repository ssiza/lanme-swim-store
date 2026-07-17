import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { StoreCreateCustomerServiceTicket } from "./store/customer-service/validators"
import { StoreVerifyOrderAccess } from "./store/orders/verify/validators"
import {
  AdminCreateCustomerServiceReply,
  AdminUpdateCustomerServiceTicket,
} from "./admin/customer-service/validators"

/**
 * CORS for public /storefront/* routes (homepage CMS). Mirrors STORE_CORS.
 */
function storefrontCors(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const storeCors = process.env.STORE_CORS || ""
  const allowed = storeCors
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  const requestOrigin = req.headers.origin

  if (requestOrigin && allowed.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin)
    res.setHeader("Vary", "Origin")
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, x-publishable-api-key, authorization"
    )
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  }

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/storefront*",
      middlewares: [storefrontCors],
    },
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

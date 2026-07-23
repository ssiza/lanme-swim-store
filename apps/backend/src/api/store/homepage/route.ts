import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildHomepagePayload } from "../../../lib/homepage-payload"

/** Store route (requires publishable key). Prefer /storefront/homepage for CMS. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await buildHomepagePayload(req.scope)
  res.json(payload)
}

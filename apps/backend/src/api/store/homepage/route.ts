import { Lanme SwimRequest, Lanme SwimResponse } from "@medusajs/framework/http"
import { buildHomepagePayload } from "../../../lib/homepage-payload"

/** Store route (requires publishable key). Prefer /storefront/homepage for CMS. */
export async function GET(req: Lanme SwimRequest, res: Lanme SwimResponse) {
  const payload = await buildHomepagePayload(req.scope)
  res.json(payload)
}

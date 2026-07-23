import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildHomepagePayload } from "../../../lib/homepage-payload"

/**
 * Public homepage CMS payload — outside /store so it does NOT require a
 * publishable API key. Marketing imagery must still render if the storefront
 * key is misconfigured.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await buildHomepagePayload(req.scope)
  res.json(payload)
}

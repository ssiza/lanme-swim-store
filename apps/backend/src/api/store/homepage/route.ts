import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getHeroBackgroundImageUrl } from "../../../lib/homepage-settings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["metadata"],
  })

  const store = stores?.[0]
  const metadata = store?.metadata as Record<string, unknown> | null | undefined

  res.json({
    hero_background_image_url: getHeroBackgroundImageUrl(metadata),
  })
}

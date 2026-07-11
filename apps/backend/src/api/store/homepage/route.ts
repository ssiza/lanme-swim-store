import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getFooterSettings } from "../../../lib/footer-settings"
import { getHeroBackgroundImageUrl } from "../../../lib/homepage-settings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["metadata"],
  })

  const store = stores?.[0]
  const metadata = store?.metadata as Record<string, unknown> | null | undefined
  const footer = getFooterSettings(metadata)

  res.json({
    hero_background_image_url: getHeroBackgroundImageUrl(metadata),
    footer_about: footer.about,
    footer_address: footer.address,
    footer_links: footer.links,
  })
}

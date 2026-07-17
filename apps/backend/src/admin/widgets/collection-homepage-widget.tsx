import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import ImageField from "../components/image-field"
import {
  getCollectionHomepageSettings,
  toCollectionHomepageMetadata,
} from "../../lib/collection-homepage-settings"

type CollectionHomepageWidgetProps = {
  data: {
    id: string
    title: string
    handle: string
    metadata?: Record<string, unknown> | null
  }
}

const CollectionHomepageWidget = ({ data }: CollectionHomepageWidgetProps) => {
  const initial = getCollectionHomepageSettings(
    data.metadata as Record<string, unknown> | null | undefined
  )

  const [coverImageUrl, setCoverImageUrl] = useState(initial.cover_image_url)
  const [mobileImageUrl, setMobileImageUrl] = useState(initial.mobile_image_url)
  const [promoHeadline, setPromoHeadline] = useState(
    initial.promo_headline ?? ""
  )
  const [description, setDescription] = useState(initial.description ?? "")
  const [ctaLabel, setCtaLabel] = useState(initial.cta_label ?? "")
  const [ctaHref, setCtaHref] = useState(
    initial.cta_href ?? `/collections/${data.handle}`
  )
  const [displayOrder, setDisplayOrder] = useState(String(initial.display_order))
  const [featured, setFeatured] = useState(initial.featured_on_homepage)
  const [showProducts, setShowProducts] = useState(
    initial.show_products_on_homepage
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(`/admin/collections/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: toCollectionHomepageMetadata({
            cover_image_url: coverImageUrl,
            mobile_image_url: mobileImageUrl,
            promo_headline: promoHeadline,
            description,
            cta_label: ctaLabel,
            cta_href: ctaHref,
            display_order: displayOrder,
            featured_on_homepage: featured,
            show_products_on_homepage: showProducts,
          }),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update collection homepage settings")
      }

      toast.success("Collection homepage settings saved")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save collection homepage settings"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">Homepage Promotion</Heading>
          <Text className="text-ui-fg-subtle text-small-regular mt-1">
            Cover imagery, promotional copy, and CTA for this collection on the
            storefront homepage. Feature it as a large banner and/or product
            rail.
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Text className="txt-compact-small-plus">Featured banner</Text>
            <Text className="text-ui-fg-subtle text-small-regular">
              Show a full-width image block when a cover image is set.
            </Text>
          </div>
          <Switch
            checked={featured}
            onCheckedChange={setFeatured}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Text className="txt-compact-small-plus">
              Show product rail on homepage
            </Text>
            <Text className="text-ui-fg-subtle text-small-regular">
              List products from this collection below the banner area.
            </Text>
          </div>
          <Switch
            checked={showProducts}
            onCheckedChange={setShowProducts}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ImageField
            label="Cover image (desktop)"
            hint="Landscape. Used on mobile too if no mobile image is set."
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            disabled={isSaving}
          />
          <ImageField
            label="Mobile image"
            hint="Portrait. Used on desktop too if no desktop image is set."
            value={mobileImageUrl}
            onChange={setMobileImageUrl}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-promo-headline">
              Promotional headline
            </Label>
            <Input
              id="collection-promo-headline"
              value={promoHeadline}
              onChange={(e) => setPromoHeadline(e.target.value)}
              placeholder={data.title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-display-order">Display order</Label>
            <Input
              id="collection-display-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="collection-description">Description (optional)</Label>
          <Textarea
            id="collection-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-cta-label">CTA label</Label>
            <Input
              id="collection-cta-label"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Shop the edit"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-cta-href">CTA destination</Label>
            <Input
              id="collection-cta-href"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder={`/collections/${data.handle}`}
            />
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_collection.details.after",
})

export default CollectionHomepageWidget

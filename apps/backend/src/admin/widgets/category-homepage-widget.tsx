import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import ImageField from "../components/image-field"
import {
  getCategoryHomepageSettings,
  toCategoryHomepageMetadata,
} from "../../lib/category-homepage-settings"

type CategoryHomepageWidgetProps = {
  data: HttpTypes.AdminProductCategory
}

const CategoryHomepageWidget = ({ data }: CategoryHomepageWidgetProps) => {
  const initial = getCategoryHomepageSettings(
    data.metadata as Record<string, unknown> | null | undefined,
    data.name
  )

  const [title, setTitle] = useState(initial.title ?? data.name ?? "")
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(initial.cover_image_url)
  const [mobileCoverImageUrl, setMobileCoverImageUrl] = useState(
    initial.mobile_cover_image_url
  )
  const [displayOrder, setDisplayOrder] = useState(String(initial.display_order))
  const [featured, setFeatured] = useState(initial.featured_on_homepage)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: toCategoryHomepageMetadata({
            title,
            subtitle,
            cover_image_url: coverImageUrl,
            mobile_cover_image_url: mobileCoverImageUrl,
            display_order: displayOrder,
            featured_on_homepage: featured,
          }),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update category homepage settings")
      }

      toast.success("Category homepage settings saved")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save category homepage settings"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">Homepage Banner</Heading>
          <Text className="text-ui-fg-subtle text-small-regular mt-1">
            Large promotional imagery for this category on the storefront
            homepage. Enable “Featured on homepage” and upload a cover image.
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Text className="txt-compact-small-plus">Featured on homepage</Text>
            <Text className="text-ui-fg-subtle text-small-regular">
              Show as a full-width image section when a cover is set.
            </Text>
          </div>
          <Switch
            checked={featured}
            onCheckedChange={setFeatured}
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-homepage-title">Title</Label>
            <Input
              id="category-homepage-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={data.name}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-homepage-order">Display order</Label>
            <Input
              id="category-homepage-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category-homepage-subtitle">Subtitle (optional)</Label>
          <Input
            id="category-homepage-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Women’s edit"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ImageField
            label="Cover image (desktop)"
            hint="Landscape banner. Used on mobile too if no mobile image is set."
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            disabled={isSaving}
          />
          <ImageField
            label="Mobile cover image"
            hint="Portrait banner. Used on desktop too if no desktop image is set."
            value={mobileCoverImageUrl}
            onChange={setMobileCoverImageUrl}
            disabled={isSaving}
          />
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryHomepageWidget

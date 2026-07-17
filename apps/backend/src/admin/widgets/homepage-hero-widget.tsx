import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Plus, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import ImageField from "../components/image-field"
import { mergeStoreMetadata } from "../../lib/footer-settings"
import {
  HERO_BACKGROUND_IMAGE_METADATA_KEY,
  HERO_SLIDES_METADATA_KEY,
  createEmptyHeroSlide,
  getHeroSlides,
  serializeHeroSlides,
  type HeroSlide,
} from "../../lib/homepage-settings"

type HomepageHeroWidgetProps = {
  data: HttpTypes.AdminStore
}

const HomepageHeroWidget = ({ data }: HomepageHeroWidgetProps) => {
  const initialSlides = getHeroSlides(
    data.metadata as Record<string, unknown> | null | undefined
  )

  const [slides, setSlides] = useState<HeroSlide[]>(
    initialSlides.length > 0 ? initialSlides : [createEmptyHeroSlide(0)]
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((current) =>
      current.map((slide, i) => (i === index ? { ...slide, ...patch } : slide))
    )
  }

  const addSlide = () => {
    setSlides((current) => [
      ...current,
      createEmptyHeroSlide(current.length),
    ])
  }

  const removeSlide = (index: number) => {
    setSlides((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0
        ? next.map((slide, i) => ({ ...slide, sort_order: i }))
        : [createEmptyHeroSlide(0)]
    })
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const ordered = slides.map((slide, index) => ({
        ...slide,
        sort_order: index,
      }))
      const primaryImage =
        ordered[0]?.desktop_image_url ||
        ordered[0]?.mobile_image_url ||
        ""

      const metadata = mergeStoreMetadata(
        data.metadata as Record<string, unknown> | null | undefined,
        {
          [HERO_SLIDES_METADATA_KEY]: serializeHeroSlides(ordered),
          // Keep legacy key in sync for older storefront builds.
          [HERO_BACKGROUND_IMAGE_METADATA_KEY]: primaryImage,
        }
      )

      const response = await fetch(`/admin/stores/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ metadata }),
      })

      if (!response.ok) {
        throw new Error("Failed to update homepage hero")
      }

      toast.success("Homepage hero saved")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save homepage hero"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">Homepage Hero</Heading>
          <Text className="text-ui-fg-subtle text-small-regular mt-1">
            Photography-first hero for the storefront. Multiple slides are
            supported for future carousels — the first slide is shown today.
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-6 px-6 py-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col gap-4 rounded-lg border border-ui-border-base p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <Text className="txt-compact-small-plus">Slide {index + 1}</Text>
              <Button
                variant="transparent"
                size="small"
                onClick={() => removeSlide(index)}
                disabled={slides.length === 1}
              >
                <Trash />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ImageField
                label="Desktop image"
                hint="Landscape, ~2400×1350. If mobile is empty, this is used on phones too."
                value={slide.desktop_image_url}
                onChange={(url) =>
                  updateSlide(index, { desktop_image_url: url })
                }
                disabled={isSaving}
              />
              <ImageField
                label="Mobile image"
                hint="Portrait, ~1080×1620. If desktop is empty, this is used on large screens too."
                value={slide.mobile_image_url}
                onChange={(url) =>
                  updateSlide(index, { mobile_image_url: url })
                }
                disabled={isSaving}
              />
            </div>
            <Text className="text-ui-fg-subtle text-small-regular">
              Upload one or both. Missing side always falls back to the image
              you provided.
            </Text>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero-headline-${slide.id}`}>Headline</Label>
                <Input
                  id={`hero-headline-${slide.id}`}
                  value={slide.headline ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { headline: e.target.value })
                  }
                  placeholder="Made for the heat."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero-sub-${slide.id}`}>Subheadline</Label>
                <Input
                  id={`hero-sub-${slide.id}`}
                  value={slide.subheadline ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { subheadline: e.target.value })
                  }
                  placeholder="Resort swimwear, quietly elevated."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero-cta-label-${slide.id}`}>CTA label</Label>
                <Input
                  id={`hero-cta-label-${slide.id}`}
                  value={slide.cta_label ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { cta_label: e.target.value })
                  }
                  placeholder="Shop resort"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero-cta-href-${slide.id}`}>CTA link</Label>
                <Input
                  id={`hero-cta-href-${slide.id}`}
                  value={slide.cta_href ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { cta_href: e.target.value })
                  }
                  placeholder="/store"
                />
              </div>
            </div>
          </div>
        ))}

        <div>
          <Button variant="secondary" size="small" onClick={addSlide}>
            <Plus />
            Add slide
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default HomepageHeroWidget

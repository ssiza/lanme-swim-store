import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { compressImageForUpload } from "../lib/compress-image-for-upload"
import { HERO_BACKGROUND_IMAGE_METADATA_KEY } from "../../lib/homepage-settings"

async function readUploadError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; type?: string }
    if (body?.message) {
      return body.message
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Upload failed (${response.status})`
}

type HomepageHeroWidgetProps = {
  data: HttpTypes.AdminStore
}

const HomepageHeroWidget = ({ data }: HomepageHeroWidgetProps) => {
  const currentUrl =
    typeof data.metadata?.[HERO_BACKGROUND_IMAGE_METADATA_KEY] === "string"
      ? (data.metadata[HERO_BACKGROUND_IMAGE_METADATA_KEY] as string)
      : null

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const updateHeroImage = async (url: string | null) => {
    const response = await fetch(`/admin/stores/${data.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        metadata: {
          [HERO_BACKGROUND_IMAGE_METADATA_KEY]: url ?? "",
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update homepage hero image")
    }

    setPreviewUrl(url)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploading(true)

    try {
      const fileToUpload = await compressImageForUpload(file)
      const formData = new FormData()
      formData.append("files", fileToUpload)

      const uploadResponse = await fetch("/admin/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!uploadResponse.ok) {
        throw new Error(await readUploadError(uploadResponse))
      }

      const { files } = (await uploadResponse.json()) as {
        files: { url: string }[]
      }

      const uploadedUrl = files?.[0]?.url

      if (!uploadedUrl) {
        throw new Error("Upload did not return an image URL")
      }

      await updateHeroImage(uploadedUrl)
      toast.success("Homepage hero background updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload hero image"
      )
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)

    try {
      await updateHeroImage(null)
      toast.success("Homepage hero background removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove hero image"
      )
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4">
        <div>
          <Heading level="h2">Homepage Hero Background</Heading>
          <Text className="text-ui-fg-subtle text-small-regular mt-1">
            Upload a background image for the storefront homepage hero. Large
            images are resized automatically before upload. A dark overlay is
            applied on the storefront so text stays readable.
          </Text>
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-lg border border-ui-border-base">
            <img
              src={previewUrl}
              alt="Homepage hero background preview"
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle">
            <Text className="text-ui-fg-subtle text-small-regular">
              No hero background image set
            </Text>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="small" disabled={isUploading} asChild>
            <label className="cursor-pointer">
              {isUploading ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>
          </Button>

          {previewUrl && (
            <Button
              variant="secondary"
              size="small"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove image"}
            </Button>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default HomepageHeroWidget

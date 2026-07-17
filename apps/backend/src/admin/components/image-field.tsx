import { Button, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { uploadAdminImage } from "../lib/upload-image"

type ImageFieldProps = {
  label: string
  hint?: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

const ImageField = ({
  label,
  hint,
  value,
  onChange,
  disabled = false,
}: ImageFieldProps) => {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploading(true)
    try {
      const url = await uploadAdminImage(file)
      onChange(url)
      toast.success(`${label} uploaded`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to upload ${label}`
      )
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Text className="txt-compact-small-plus text-ui-fg-base">{label}</Text>
      {hint ? (
        <Text className="text-ui-fg-subtle text-small-regular">{hint}</Text>
      ) : null}

      {value ? (
        <div className="overflow-hidden rounded-lg border border-ui-border-base">
          <img
            src={value}
            alt={`${label} preview`}
            className="h-36 w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle">
          <Text className="text-ui-fg-subtle text-small-regular">
            No image set
          </Text>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="small"
          disabled={disabled || isUploading}
          asChild
        >
          <label className="cursor-pointer">
            {isUploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={disabled || isUploading}
            />
          </label>
        </Button>

        {value ? (
          <Button
            variant="secondary"
            size="small"
            disabled={disabled || isUploading}
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default ImageField

import { compressImageForUpload } from "./compress-image-for-upload"
import { sdk } from "./sdk"

/** Compress + upload a single image via Lanme Swim admin uploads. */
export async function uploadAdminImage(file: File): Promise<string> {
  const fileToUpload = await compressImageForUpload(file)

  const { files } = await sdk.admin.upload.create({
    files: [fileToUpload],
  })

  const uploadedUrl = files?.[0]?.url

  if (!uploadedUrl) {
    throw new Error("Upload did not return an image URL")
  }

  return uploadedUrl
}

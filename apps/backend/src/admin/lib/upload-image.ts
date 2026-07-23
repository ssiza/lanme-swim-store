import { compressImageForUpload } from "./compress-image-for-upload"

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

/** Compress + upload a single image via Lanme Swim admin uploads. */
export async function uploadAdminImage(file: File): Promise<string> {
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

  return uploadedUrl
}

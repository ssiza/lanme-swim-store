const MAX_WIDTH = 2560
const TARGET_MAX_BYTES = 2 * 1024 * 1024
const JPEG_QUALITY = 0.85

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read image"))
    }

    img.src = url
  })
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  name: string,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image"))
          return
        }

        const baseName = name.replace(/\.[^.]+$/, "") || "upload"
        resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }))
      },
      "image/jpeg",
      quality
    )
  })
}

/** Resize/compress large raster images before admin upload (hero backgrounds). */
export async function compressImageForUpload(file: File): Promise<File> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_WIDTH / img.width)
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const needsResize = scale < 1
  const needsCompress = file.size > TARGET_MAX_BYTES

  if (!needsResize && !needsCompress && file.type === "image/jpeg") {
    return file
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return file
  }

  ctx.drawImage(img, 0, 0, width, height)

  let quality = JPEG_QUALITY
  let compressed = await canvasToFile(canvas, file.name, quality)

  while (compressed.size > TARGET_MAX_BYTES && quality > 0.5) {
    quality -= 0.1
    compressed = await canvasToFile(canvas, file.name, quality)
  }

  return compressed
}

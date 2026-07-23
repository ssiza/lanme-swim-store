import { PutObjectCommand } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { FileTypes } from "@medusajs/framework/types"
import { Lanme SwimError } from "@medusajs/framework/utils"
import { S3FileService } from "@medusajs/file-s3/dist/services/s3-file"
import path from "path"
import { PassThrough } from "stream"
import { ulid } from "ulid"

const DEFAULT_UPLOAD_EXPIRATION_DURATION_SECONDS = 60 * 60

/**
 * S3 file provider without object ACLs.
 * Required for buckets with Object Ownership = Bucket owner enforced (AWS default since 2023).
 * Use a bucket policy for public reads instead of ACLs.
 */
export default class S3NoAclFileService extends S3FileService {
  static override identifier = "s3"

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file) {
      throw new Lanme SwimError(Lanme SwimError.Types.INVALID_DATA, "No file provided")
    }

    if (!file.filename) {
      throw new Lanme SwimError(
        Lanme SwimError.Types.INVALID_DATA,
        "No filename provided"
      )
    }

    const parsedFilename = path.parse(file.filename)
    const fileKey = `${this.config_.prefix}${parsedFilename.name}-${ulid()}${parsedFilename.ext}`

    let content: Buffer
    try {
      const decoded = Buffer.from(file.content, "base64")
      if (decoded.toString("base64") === file.content) {
        content = decoded
      } else {
        content = Buffer.from(file.content, "utf8")
      }
    } catch {
      content = Buffer.from(file.content, "binary")
    }

    const command = new PutObjectCommand({
      Bucket: this.config_.bucket,
      Body: content,
      Key: fileKey,
      ContentType: file.mimeType,
      CacheControl: this.config_.cacheControl,
      Metadata: {
        "original-filename": encodeURIComponent(file.filename),
      },
    })

    try {
      await this.client_.send(command)
    } catch (error) {
      this.logger_.error(error)
      throw error
    }

    const encodedKey = fileKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")

    return {
      url: `${this.config_.fileUrl}/${encodedKey}`,
      key: fileKey,
    }
  }

  async getUploadStream(fileData: FileTypes.ProviderUploadStreamDTO) {
    if (!fileData.filename) {
      throw new Lanme SwimError(
        Lanme SwimError.Types.INVALID_DATA,
        "No filename provided"
      )
    }

    const parsedFilename = path.parse(fileData.filename)
    const fileKey = `${this.config_.prefix}${parsedFilename.name}-${ulid()}${parsedFilename.ext}`
    const pass = new PassThrough()

    const upload = new Upload({
      client: this.client_,
      params: {
        Bucket: this.config_.bucket,
        Key: fileKey,
        Body: pass,
        ContentType: fileData.mimeType,
        CacheControl: this.config_.cacheControl,
        Metadata: {
          "original-filename": encodeURIComponent(fileData.filename),
        },
      },
    })

    const encodedKey = fileKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")

    const promise = upload.done().then(() => ({
      url: `${this.config_.fileUrl}/${encodedKey}`,
      key: fileKey,
    }))

    return {
      writeStream: pass,
      promise,
      url: `${this.config_.fileUrl}/${encodedKey}`,
      fileKey,
    }
  }

  async getPresignedUploadUrl(fileData: FileTypes.ProviderGetPresignedUploadUrlDTO) {
    if (!fileData?.filename) {
      throw new Lanme SwimError(
        Lanme SwimError.Types.INVALID_DATA,
        "No filename provided"
      )
    }

    const fileKey = `${this.config_.prefix}${fileData.filename}`

    const command = new PutObjectCommand({
      Bucket: this.config_.bucket,
      ContentType: fileData.mimeType,
      Key: fileKey,
    })

    const signedUrl = await getSignedUrl(this.client_, command, {
      expiresIn:
        fileData.expiresIn ?? DEFAULT_UPLOAD_EXPIRATION_DURATION_SECONDS,
    })

    return {
      url: signedUrl,
      key: fileKey,
    }
  }
}

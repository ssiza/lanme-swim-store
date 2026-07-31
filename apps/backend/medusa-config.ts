import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { chunkLoadErrorReload } from './src/admin/vite/chunk-load-error-reload'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Railway Redis resolves to IPv6 by default; ioredis needs family=0 for dual-stack.
 * @see https://docs.railway.com/guides/redis#connecting-to-redis
 */
function resolveRedisUrl(): string | undefined {
  const url = process.env.REDIS_URL
  if (!url) {
    return undefined
  }

  if (/[?&]family=/.test(url)) {
    return url
  }

  const joiner = url.includes('?') ? '&' : '?'
  return `${url}${joiner}family=0`
}

const redisUrl = resolveRedisUrl()

const maxUploadFileSizeMb = Number(process.env.MEDUSA_MAX_UPLOAD_FILE_SIZE_MB ?? '10')
const maxUploadFileSize =
  Number.isFinite(maxUploadFileSizeMb) && maxUploadFileSizeMb > 0
    ? maxUploadFileSizeMb * 1024 * 1024
    : 10 * 1024 * 1024

/** Comma-separated origin lists: trim, drop trailing slashes, de-dupe. */
function mergeCorsOrigins(...groups: Array<string | undefined>): string {
  const origins = new Set<string>()
  for (const group of groups) {
    for (const part of (group || "").split(",")) {
      const origin = part.trim().replace(/\/$/, "")
      if (origin) {
        origins.add(origin)
      }
    }
  }
  return [...origins].join(",")
}

const backendPublicUrl = process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") || ""
const storefrontPublicUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "") || ""

// Always include the public backend/storefront URLs so a custom domain
// (e.g. https://api.lanmeswim.com) works even when CORS env still lists only
// the Railway *.up.railway.app hostname.
const storeCors = mergeCorsOrigins(process.env.STORE_CORS, storefrontPublicUrl)
const adminCors = mergeCorsOrigins(process.env.ADMIN_CORS, backendPublicUrl)
const authCors = mergeCorsOrigins(
  process.env.AUTH_CORS,
  process.env.ADMIN_CORS,
  process.env.STORE_CORS,
  backendPublicUrl,
  storefrontPublicUrl
)

type PaymentProviderConfig = {
  resolve: string
  id: string
  options: {
    apiKey: string
    webhookSecret?: string
  }
}

type FileProviderConfig = {
  resolve: string
  id: string
  options?: Record<string, unknown>
}

type NotificationProviderConfig = {
  resolve: string
  id: string
  options: Record<string, unknown>
}

const paymentModuleProviders: PaymentProviderConfig[] = []

if (process.env.STRIPE_API_KEY) {
  paymentModuleProviders.push({
    resolve: '@medusajs/medusa/payment-stripe',
    id: 'stripe',
    options: {
      apiKey: process.env.STRIPE_API_KEY,
      ...(process.env.STRIPE_WEBHOOK_SECRET && {
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      }),
    },
  })
}

const isS3Configured = () =>
  Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_REGION &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_FILE_URL
  )

const fileModuleProviders: FileProviderConfig[] = []

if (isS3Configured()) {
  fileModuleProviders.push({
    resolve: './src/modules/file-s3-no-acl',
    id: 's3',
    options: {
      file_url: process.env.S3_FILE_URL,
      access_key_id: process.env.S3_ACCESS_KEY_ID,
      secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION,
      bucket: process.env.S3_BUCKET,
      ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
      ...(process.env.S3_FORCE_PATH_STYLE === 'true' && {
        additional_client_config: {
          forcePathStyle: true,
        },
      }),
    },
  })
} else {
  const backendBase =
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, '') ||
    'http://localhost:9000'

  fileModuleProviders.push({
    resolve: '@medusajs/medusa/file-local',
    id: 'local',
    options: {
      backend_url: `${backendBase}/static`,
    },
  })
}

const modules: Array<{
  resolve: string
  options?: Record<string, unknown>
}> = [
  {
    resolve: "./src/modules/customer-service",
  },
  {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: paymentModuleProviders,
    },
  },
  {
    resolve: '@medusajs/medusa/file',
    options: {
      providers: fileModuleProviders,
    },
  },
]

const notificationProviders: NotificationProviderConfig[] = [
  {
    resolve: "@medusajs/medusa/notification-local",
    id: "local",
    options: {
      channels: ["feed"],
    },
  },
]

if (process.env.RESEND_API_KEY) {
  notificationProviders.push({
    resolve: "./src/modules/resend",
    id: "resend",
    options: {
      channels: ["email"],
      api_key: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
      ...(process.env.RESEND_FROM_NAME && {
        from_name: process.env.RESEND_FROM_NAME,
      }),
      ...(process.env.RESEND_REPLY_TO && {
        reply_to: process.env.RESEND_REPLY_TO,
      }),
      ...(process.env.RESEND_DEV_REDIRECT && {
        dev_redirect: process.env.RESEND_DEV_REDIRECT,
      }),
    },
  })
}

modules.push({
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: notificationProviders,
  },
})

if (redisUrl) {
  modules.push(
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: {
        redisUrl,
      },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: {
        redisUrl,
      },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: {
        redis: {
          redisUrl,
        },
      },
    },
    {
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [
          {
            id: 'locking-redis',
            resolve: '@medusajs/medusa/locking-redis',
            is_default: true,
            options: {
              redisUrl,
            },
          },
        ],
      },
    }
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(redisUrl && { redisUrl }),
    // trustProxy is honored by Express/Medusa at runtime but is not on the
    // HttpCompression / projectConfig.http type in @medusajs/framework 2.16.0
    // (TS2769). Cast keeps the runtime flag without failing `medusa build`.
    http: {
      storeCors,
      adminCors,
      authCors,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      trustProxy: true,
    } as {
      storeCors: string
      adminCors: string
      authCors: string
      jwtSecret: string | undefined
      cookieSecret: string | undefined
    },
  },
  admin: {
    // Baked into the Admin SPA at `medusa build` time. Use same-origin "/" so
    // production never calls http://localhost:9000 (the previous fallback),
    // which surfaces in browsers as "Load failed" on login.
    // Runtime invite emails use getBackendBaseUrl() / MEDUSA_BACKEND_URL instead.
    backendUrl: process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") || "/",
    storefrontUrl: process.env.STOREFRONT_URL || "http://localhost:8000",
    maxUploadFileSize,
    vite: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
      },
      plugins: [...(config.plugins ?? []), chunkLoadErrorReload()],
    }),
  },
  modules,
})

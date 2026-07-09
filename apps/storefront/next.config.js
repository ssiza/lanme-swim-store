const path = require("path")
const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @param {string | undefined} url
 * @returns {import('next').RemotePattern | null}
 */
const parseRemotePattern = (url) => {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const pathname =
      parsed.pathname && parsed.pathname !== "/"
        ? `${parsed.pathname.replace(/\/$/, "")}/**`
        : "/**"

    return {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname,
    }
  } catch {
    return null
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const backendRemotePattern = parseRemotePattern(BACKEND_URL)
const s3PublicRemotePattern = parseRemotePattern(S3_PUBLIC_URL)

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "standalone",
  // Monorepo: trace dependencies from repo root (matches Docker WORKDIR /app).
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(backendRemotePattern ? [backendRemotePattern] : []),
      ...(s3PublicRemotePattern ? [s3PublicRemotePattern] : []),
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig

const BACKEND_TIMEOUT_MS = 5000

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? null
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? null
  const hasPublishableKey = Boolean(publishableKey)

  let backendReachable = false
  let hasRegions = false
  let hasUsCountry = false
  let backendError: string | null = null

  if (backendUrl && publishableKey) {
    try {
      const response = await fetch(`${backendUrl}/store/regions`, {
        headers: {
          "x-publishable-api-key": publishableKey,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      })

      backendReachable = response.ok

      if (response.ok) {
        const data = (await response.json()) as {
          regions?: Array<{
            countries?: Array<{ iso_2?: string }>
          }>
        }
        const regions = data.regions ?? []
        hasRegions = regions.length > 0
        hasUsCountry = regions.some((region) =>
          region.countries?.some(
            (country) => country.iso_2?.toLowerCase() === "us"
          )
        )
      } else {
        backendError = `HTTP ${response.status}`
      }
    } catch (error) {
      backendError =
        error instanceof Error ? error.message : "Backend request failed"
    }
  }

  return Response.json({
    ok: true,
    env: {
      backendUrl: backendUrl ?? "unset",
      hasPublishableKey,
      defaultRegion: process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "unset",
      nodeEnv: process.env.NODE_ENV ?? "unset",
    },
    backend: {
      reachable: backendReachable,
      hasRegions,
      hasUsCountry,
      error: backendError,
    },
  })
}

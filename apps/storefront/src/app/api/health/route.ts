/**
 * Liveness probe for Railway / load balancers.
 * Keep this instant — do not call Lanme Swim here or a backend outage will fail deploys.
 * Use /api/ready for backend connectivity checks.
 */
export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "storefront",
      env: {
        hasBackendUrl: Boolean(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL),
        hasPublishableKey: Boolean(
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        ),
        defaultRegion: process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "unset",
        nodeEnv: process.env.NODE_ENV ?? "unset",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}

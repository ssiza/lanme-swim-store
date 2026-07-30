import { ExecArgs } from "@medusajs/framework/types"
import { enableStripeOnRegions } from "../lib/enable-stripe-on-regions"

/**
 * Ops helper for environments where Stripe was added after the migration already
 * ran without STRIPE_API_KEY:
 *   npx medusa exec ./src/scripts/enable-stripe-on-regions.ts
 *
 * Also runs automatically via `src/migration-scripts/enable-stripe-on-regions.ts`
 * on `medusa db:migrate` when the API key is present.
 */
export default async function enableStripeOnRegionsScript({
  container,
}: ExecArgs) {
  await enableStripeOnRegions(container)
}

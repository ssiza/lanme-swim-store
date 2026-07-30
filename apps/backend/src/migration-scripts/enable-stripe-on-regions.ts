import { MedusaContainer } from "@medusajs/framework"
import { enableStripeOnRegions } from "../lib/enable-stripe-on-regions"

/**
 * When STRIPE_API_KEY is set, ensure every region can use Stripe checkout.
 * Seed data only enables manual payment; this backfills Stripe onto existing
 * regions after the env var is added (runs via `medusa db:migrate`).
 */
export default async function enableStripeOnRegionsMigration({
  container,
}: {
  container: MedusaContainer
}) {
  await enableStripeOnRegions(container)
}

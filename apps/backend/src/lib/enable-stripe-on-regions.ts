import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

/**
 * Idempotently link the Stripe payment provider to every region when
 * STRIPE_API_KEY is configured. Safe to run on every boot / migrate.
 */
export async function enableStripeOnRegions(
  container: MedusaContainer
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!process.env.STRIPE_API_KEY) {
    logger.info(
      "STRIPE_API_KEY is not set — skipping Stripe region payment-provider link."
    )
    return
  }

  const paymentModule = container.resolve(Modules.PAYMENT)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const providers = await paymentModule.listPaymentProviders({
    id: STRIPE_PROVIDER_ID,
    is_enabled: true,
  })

  if (!providers.length) {
    logger.warn(
      `Stripe provider ${STRIPE_PROVIDER_ID} is not registered/enabled. ` +
        "Confirm STRIPE_API_KEY and restart the backend before linking regions."
    )
    return
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  })

  if (!regions?.length) {
    logger.info("No regions found — nothing to link for Stripe.")
    return
  }

  let linked = 0

  for (const region of regions) {
    const existing = (region.payment_providers ?? []).map(
      (provider: { id?: string }) => provider.id
    )

    if (existing.includes(STRIPE_PROVIDER_ID)) {
      continue
    }

    await link.create({
      [Modules.REGION]: {
        region_id: region.id,
      },
      [Modules.PAYMENT]: {
        payment_provider_id: STRIPE_PROVIDER_ID,
      },
    })

    linked += 1
    logger.info(
      `Enabled Stripe (${STRIPE_PROVIDER_ID}) on region "${region.name}" (${region.id}).`
    )
  }

  if (linked === 0) {
    logger.info("All regions already have Stripe enabled.")
  } else {
    logger.info(`Linked Stripe to ${linked} region(s).`)
  }
}

import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getExecFlagValue } from "../lib/script-args"

/**
 * Explains why GET /store/shipping-options returns an empty list.
 *
 *   npx medusa exec ./src/scripts/diagnose-shipping-options.ts -- --cart cart_123
 *   npx medusa exec ./src/scripts/diagnose-shipping-options.ts -- --country us
 *
 * The store API hands back `{ shipping_options: [] }` with a 200 for several
 * unrelated misconfigurations, so "shipping is configured in Admin" and "the
 * customer sees delivery options" are two very different claims. This walks the
 * same chain `listShippingOptionsForCartWorkflow` walks and reports the first
 * link that breaks:
 *
 *   cart.sales_channel_id
 *     -> sales channel is linked to a stock location
 *       -> stock location has a fulfillment set
 *         -> fulfillment set has a service zone
 *           -> service zone has a geo zone matching the shipping address
 *             -> service zone has shipping options
 *               -> option rules allow enabled_in_store=true / is_return=false
 */

type ScriptInput = {
  container: MedusaContainer
  args: string[]
}

type GeoZone = {
  id: string
  type: string
  country_code: string | null
  province_code: string | null
  city: string | null
  postal_expression: unknown
}

type ShippingOptionRule = {
  attribute: string
  operator: string
  value: unknown
}

type ShippingOption = {
  id: string
  name: string
  price_type: string
  rules?: ShippingOptionRule[]
}

type ServiceZone = {
  id: string
  name: string
  geo_zones?: GeoZone[]
  shipping_options?: ShippingOption[]
}

type FulfillmentSet = {
  id: string
  name: string
  type: string
  service_zones?: ServiceZone[]
}

type StockLocation = {
  id: string
  name: string
  fulfillment_sets?: FulfillmentSet[]
}

type CartAddress = {
  country_code?: string | null
  province?: string | null
  city?: string | null
  postal_code?: string | null
}

type CartItem = {
  id: string
  title?: string | null
  quantity: number
  variant?: {
    id?: string
    manage_inventory?: boolean
    allow_backorder?: boolean
    inventory_items?: {
      inventory?: {
        id?: string
        sku?: string | null
        requires_shipping?: boolean
        location_levels?: {
          location_id: string
          available_quantity: number
        }[]
      }
    }[]
  } | null
}

/**
 * Mirrors the `insufficient_inventory` calculation in
 * listShippingOptionsForCartWorkflow. Note the `!level ? true` branch: an item
 * with NO stock level at a location counts as insufficient, so a location that
 * was never stocked fails for every item rather than being treated as zero.
 */
const pickupBlockers = (items: CartItem[], locationId: string) => {
  const blockers: string[] = []

  for (const item of items) {
    const variant = item.variant

    if (!variant?.manage_inventory || variant.allow_backorder) {
      continue
    }

    for (const link of variant.inventory_items ?? []) {
      const inventory = link.inventory

      if (!inventory?.requires_shipping) {
        continue
      }

      const level = (inventory.location_levels ?? []).find(
        (candidate) => candidate.location_id === locationId
      )

      if (!level) {
        blockers.push(
          `"${item.title ?? item.id}" (sku ${inventory.sku ?? "?"}) has no stock level at this location`
        )
      } else if (level.available_quantity < item.quantity) {
        blockers.push(
          `"${item.title ?? item.id}" needs ${item.quantity}, location has ${level.available_quantity}`
        )
      }
    }
  }

  return blockers
}

/** query.graph types every relation as `Maybe<T>[]`; drop the holes. */
const compact = <T>(values: (T | null | undefined)[]): T[] =>
  values.filter((value): value is T => value !== null && value !== undefined)

const line = (text = "") => console.log(text)
const ok = (text: string) => console.log(`  PASS  ${text}`)
const fail = (text: string) => console.log(`  FAIL  ${text}`)
const warn = (text: string) => console.log(`  WARN  ${text}`)

/**
 * Mirrors FulfillmentModuleService.buildGeoZoneConstraintsFromAddress: the
 * candidate geo zones are OR'd from narrowest (zip) to broadest (country), so a
 * plain country zone is enough as long as the country codes actually match.
 */
const matchesAddress = (zone: GeoZone, address: CartAddress) => {
  const country = address.country_code?.toLowerCase()
  const province = address.province?.toLowerCase()
  const city = address.city?.toLowerCase()

  if (!country || zone.country_code?.toLowerCase() !== country) {
    return false
  }

  if (zone.type === "country") {
    return true
  }

  if (zone.province_code?.toLowerCase() !== province) {
    return false
  }

  if (zone.type === "province") {
    return true
  }

  if (zone.city?.toLowerCase() !== city) {
    return false
  }

  // zip zones additionally match on postal_expression, which can be a regex or
  // a list; treat a city-level match as "close enough" and flag it for review.
  return zone.type === "city" || zone.type === "zip"
}

/** Mirrors the `{ is_return: "false", enabled_in_store: "true" }` rule context. */
const passesStoreContext = (option: ShippingOption) => {
  const reasons: string[] = []

  for (const rule of option.rules ?? []) {
    const value = String(rule.value)

    if (rule.attribute === "enabled_in_store") {
      const allowsTrue =
        (rule.operator === "eq" && value === "true") ||
        (rule.operator === "ne" && value !== "true") ||
        (rule.operator === "in" && value.includes("true"))

      if (!allowsTrue) {
        reasons.push(
          `rule enabled_in_store ${rule.operator} ${value} excludes storefront traffic`
        )
      }
    }

    if (rule.attribute === "is_return") {
      const allowsFalse =
        (rule.operator === "eq" && value === "false") ||
        (rule.operator === "ne" && value !== "false") ||
        (rule.operator === "in" && value.includes("false"))

      if (!allowsFalse) {
        reasons.push(`rule is_return ${rule.operator} ${value} marks this as return-only`)
      }
    }
  }

  return reasons
}

export default async function diagnoseShippingOptions({
  container,
  args,
}: ScriptInput) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const cartId = getExecFlagValue(args, "cart")
  const countryFlag = getExecFlagValue(args, "country")

  let salesChannelId: string | null = null
  let address: CartAddress = {}
  let cartItems: CartItem[] = []

  line()
  line("=== Shipping options diagnostic ===")
  line()

  if (cartId) {
    const { data: carts } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "sales_channel_id",
        "region_id",
        "currency_code",
        "shipping_address.country_code",
        "shipping_address.province",
        "shipping_address.city",
        "shipping_address.postal_code",
        "items.id",
        "items.title",
        "items.quantity",
        "items.variant.id",
        "items.variant.manage_inventory",
        "items.variant.allow_backorder",
        "items.variant.inventory_items.inventory.id",
        "items.variant.inventory_items.inventory.sku",
        "items.variant.inventory_items.inventory.requires_shipping",
        "items.variant.inventory_items.inventory.location_levels.location_id",
        "items.variant.inventory_items.inventory.location_levels.available_quantity",
      ],
    })

    const cart = carts?.[0]

    if (!cart) {
      fail(`No cart found with id ${cartId}`)
      return
    }

    line(`Cart ${cart.id}`)

    // These three are hard requirements: validatePresenceOfStep rejects the
    // request outright when any is missing, which surfaces as a failed fetch
    // rather than an empty list.
    for (const field of ["sales_channel_id", "region_id", "currency_code"]) {
      if (cart[field]) {
        ok(`cart.${field} = ${cart[field]}`)
      } else {
        fail(
          `cart.${field} is empty - /store/shipping-options rejects this cart entirely`
        )
      }
    }

    // query.graph's generated types describe the full entity, not the subset
    // selected in `fields`, and mark every relation nullable. Narrow at the
    // boundary rather than fighting it at each use site.
    address = (cart.shipping_address ?? {}) as unknown as CartAddress
    salesChannelId = cart.sales_channel_id ?? null
    cartItems = compact((cart.items ?? []) as unknown as (CartItem | null)[])

    if (!address.country_code) {
      warn(
        "cart has no shipping address yet - an empty option list is expected until the customer saves one"
      )
    } else {
      ok(
        `shipping address = ${[address.city, address.province, address.postal_code, address.country_code]
          .filter(Boolean)
          .join(", ")}`
      )
    }
  } else {
    address = { country_code: (countryFlag ?? "us").toLowerCase() }
    line(
      `No --cart given; auditing config against country "${address.country_code}" using the default sales channel.`
    )

    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "default_sales_channel_id"],
    })

    salesChannelId = stores?.[0]?.default_sales_channel_id ?? null

    if (salesChannelId) {
      ok(`store default sales channel = ${salesChannelId}`)
    } else {
      fail(
        "store has no default_sales_channel_id - new carts are created without a sales channel and every shipping-options request fails"
      )
      return
    }
  }

  if (!salesChannelId) {
    line()
    fail("Stopping: no sales channel to resolve stock locations from.")
    return
  }

  line()
  line("--- Sales channel -> stock locations -> fulfillment sets ---")

  const { data: channels } = await query.graph({
    entity: "sales_channels",
    filters: { id: salesChannelId },
    fields: [
      "id",
      "name",
      "is_disabled",
      "stock_locations.id",
      "stock_locations.name",
      "stock_locations.fulfillment_sets.id",
      "stock_locations.fulfillment_sets.name",
      "stock_locations.fulfillment_sets.type",
    ],
  })

  const channel = channels?.[0]

  if (!channel) {
    fail(`Sales channel ${salesChannelId} does not exist`)
    return
  }

  line(`Sales channel "${channel.name}" (${channel.id})`)

  if (channel.is_disabled) {
    fail("sales channel is disabled")
  }

  const stockLocations = compact(
    (channel.stock_locations ?? []) as unknown as (StockLocation | null)[]
  )

  if (!stockLocations.length) {
    fail(
      "sales channel has NO stock locations linked - this alone produces an empty option list with a 200 response"
    )
    line()
    line(
      "    Fix in Admin: Settings -> Locations & Shipping -> open the location"
    )
    line(
      "    -> Sales Channels -> add the channel above. Shipping options can look"
    )
    line("    perfectly configured and still be unreachable without this link.")
    return
  }

  const fulfillmentSetIds: string[] = []
  const locationByFulfillmentSet = new Map<string, StockLocation>()

  for (const location of stockLocations) {
    const sets = location.fulfillment_sets ?? []
    if (!sets.length) {
      fail(`location "${location.name}" has no fulfillment sets`)
      continue
    }

    ok(
      `location "${location.name}" -> ${sets
        .map((set) => `${set.name} (${set.type})`)
        .join(", ")}`
    )

    for (const set of sets) {
      fulfillmentSetIds.push(set.id)
      locationByFulfillmentSet.set(set.id, location)
    }
  }

  if (!fulfillmentSetIds.length) {
    line()
    fail(
      "No fulfillment sets reachable from this sales channel - the option query filters on an empty id list and returns nothing."
    )
    return
  }

  line()
  line("--- Service zones -> geo zones -> shipping options ---")

  const { data: sets } = await query.graph({
    entity: "fulfillment_sets",
    filters: { id: fulfillmentSetIds },
    fields: [
      "id",
      "name",
      "type",
      "service_zones.id",
      "service_zones.name",
      "service_zones.geo_zones.id",
      "service_zones.geo_zones.type",
      "service_zones.geo_zones.country_code",
      "service_zones.geo_zones.province_code",
      "service_zones.geo_zones.city",
      "service_zones.geo_zones.postal_expression",
      "service_zones.shipping_options.id",
      "service_zones.shipping_options.name",
      "service_zones.shipping_options.price_type",
      "service_zones.shipping_options.rules.attribute",
      "service_zones.shipping_options.rules.operator",
      "service_zones.shipping_options.rules.value",
    ],
  })

  let deliverable = 0
  let pickupBlocked = 0
  let zoneMatched = false

  for (const set of compact(
    (sets ?? []) as unknown as (FulfillmentSet | null)[]
  )) {
    const zones = compact(set.service_zones ?? [])

    if (!zones.length) {
      fail(`fulfillment set "${set.name}" has no service zones`)
      continue
    }

    for (const zone of zones) {
      const geoZones = zone.geo_zones ?? []
      const options = zone.shipping_options ?? []

      const matches = address.country_code
        ? geoZones.filter((geo) => matchesAddress(geo, address))
        : geoZones

      const summary = geoZones.length
        ? geoZones
            .map((geo) => `${geo.type}:${geo.country_code ?? "?"}`)
            .join(", ")
        : "none"

      line()
      line(`Service zone "${zone.name}" (${set.name} / ${set.type})`)
      line(`  geo zones: ${summary}`)

      if (!geoZones.length) {
        fail("no geo zones - nothing can ever match an address here")
        continue
      }

      if (!matches.length) {
        fail(
          `no geo zone covers "${address.country_code}" - options in this zone are invisible to that address`
        )
        continue
      }

      zoneMatched = true
      ok(`${matches.length} geo zone(s) cover "${address.country_code}"`)

      if (!options.length) {
        fail("service zone has no shipping options attached")
        continue
      }

      for (const option of options) {
        const problems = passesStoreContext(option)

        if (problems.length) {
          fail(`option "${option.name}" hidden: ${problems.join("; ")}`)
          continue
        }

        if (set.type === "pickup") {
          const location = locationByFulfillmentSet.get(set.id)
          const blockers = location
            ? pickupBlockers(cartItems, location.id)
            : []

          if (blockers.length) {
            // The option IS returned by the API, but flagged
            // insufficient_inventory, which the storefront renders as a
            // disabled radio the customer cannot select.
            fail(
              `option "${option.name}" returned but NOT selectable (insufficient_inventory) at "${location?.name}":`
            )
            for (const blocker of blockers) {
              line(`          - ${blocker}`)
            }
            pickupBlocked += 1
            continue
          }

          ok(`option "${option.name}" available (pickup)`)
        } else {
          ok(`option "${option.name}" available (${option.price_type})`)
        }
        deliverable += 1
      }
    }
  }

  line()
  line("=== Verdict ===")

  if (deliverable > 0) {
    ok(
      `${deliverable} shipping option(s) should be returned for this address. If the storefront still shows none, compare the cart's sales channel with the one audited above.`
    )
    return
  }

  if (pickupBlocked > 0) {
    fail(
      `${pickupBlocked} pickup option(s) are returned by the API but flagged insufficient_inventory, so the customer cannot select them and cannot leave the delivery step. Add stock levels for the items above at that location (Admin -> Inventory -> item -> Locations), or enable backorder on the variants.`
    )
    return
  }

  if (!zoneMatched) {
    fail(
      `No service zone covers "${address.country_code}". Add a geo zone for that country to a service zone on a fulfillment set belonging to a stock location linked to this sales channel.`
    )
    return
  }

  fail(
    "Geo zones match but every option was filtered out. Re-check each option's rules in Admin - an option must allow enabled_in_store=true and must not be marked return-only."
  )
}

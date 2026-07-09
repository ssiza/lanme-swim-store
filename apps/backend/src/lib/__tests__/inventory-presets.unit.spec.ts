import {
  buildPlannedSetupVariants,
  buildReusableInventorySpecs,
  generateReusableInventorySku,
  generateReusableInventoryTitle,
  getInventoryPreset,
  INVENTORY_PRESET_NAMES,
} from "../inventory-presets"
import { buildSetupProductInventoryPlan } from "../setup-product-inventory-planning"
import { hasOnlyDefaultVariants } from "../product-variant-presets"

describe("inventory presets", () => {
  it("exposes all reusable inventory presets", () => {
    expect(INVENTORY_PRESET_NAMES).toEqual([
      "apparel-sizes",
      "shorts-sizes",
      "apparel-size-color",
      "one-size",
    ])
  })

  it("builds reusable size-only inventory titles and SKUs", () => {
    expect(generateReusableInventoryTitle({ Size: "XL" })).toBe("XL")
    expect(generateReusableInventorySku({ Size: "XL" })).toBe("APPAREL-XL")
  })

  it("builds reusable size + color inventory titles and SKUs", () => {
    expect(
      generateReusableInventoryTitle({ Size: "XL", Color: "White" })
    ).toBe("XL / White")
    expect(generateReusableInventorySku({ Size: "XL", Color: "White" })).toBe(
      "APPAREL-XL-WHITE"
    )
  })

  it("builds one-size reusable inventory", () => {
    expect(generateReusableInventoryTitle({ Size: "One Size" })).toBe(
      "One Size"
    )
    expect(generateReusableInventorySku({ Size: "One Size" })).toBe("ONE-SIZE")
  })

  it("does not include product handle in reusable inventory SKUs", () => {
    const specs = buildReusableInventorySpecs(getInventoryPreset("shorts-sizes"))

    expect(specs.map((spec) => spec.sku)).toEqual([
      "APPAREL-XS",
      "APPAREL-S",
      "APPAREL-M",
      "APPAREL-L",
      "APPAREL-XL",
      "APPAREL-2XL",
    ])
    expect(specs.every((spec) => !spec.sku.includes("FANARC"))).toBe(true)
  })

  it("builds size x color combinations for apparel-size-color", () => {
    const specs = buildReusableInventorySpecs(
      getInventoryPreset("apparel-size-color")
    )

    expect(specs).toHaveLength(7 * 5)
    expect(specs.some((spec) => spec.title === "M / Black")).toBe(true)
    expect(specs.some((spec) => spec.sku === "APPAREL-M-BLACK")).toBe(true)
  })

  it("keeps product-specific variant SKUs while inventory stays reusable", () => {
    const planned = buildPlannedSetupVariants(
      "fanarc-denim-short",
      getInventoryPreset("shorts-sizes")
    )

    expect(planned[0]).toMatchObject({
      title: "XS",
      variantSku: "FANARC-DENIM-SHORT-XS",
      inventory: {
        title: "XS",
        sku: "APPAREL-XS",
      },
    })
  })
})

describe("setup product inventory planning", () => {
  const defaultProduct = {
    id: "prod_1",
    title: "Fanarc Denim Short",
    handle: "fanarc-denim-short",
    options: [{ id: "opt_default", title: "Default option" }],
    variants: [
      {
        id: "variant_default",
        title: "Default variant",
        options: [
          {
            value: "Default option value",
            option: { title: "Default option" },
          },
        ],
        prices: [{ amount: 4900, currency_code: "usd" }],
      },
    ],
  }

  it("plans reusable inventory for default-only products", () => {
    const plan = buildSetupProductInventoryPlan({
      product: defaultProduct,
      preset: getInventoryPreset("shorts-sizes"),
    })

    expect(hasOnlyDefaultVariants(defaultProduct)).toBe(true)
    expect(plan.skip).toBe(false)
    expect(plan.variantsToCreate).toHaveLength(6)
    expect(plan.variantsToCreate[0]?.inventory.sku).toBe("APPAREL-XS")
    expect(plan.requiresForce).toBe(true)
  })

  it("adds missing preset variants for partially configured products", () => {
    const productWithVariants = {
      ...defaultProduct,
      options: [{ id: "opt_size", title: "Size" }],
      variants: [
        {
          id: "variant_xl",
          title: "XL",
          options: [{ value: "XL", option: { title: "Size" } }],
        },
      ],
    }

    const plan = buildSetupProductInventoryPlan({
      product: productWithVariants,
      preset: getInventoryPreset("shorts-sizes"),
    })

    expect(plan.skip).toBe(false)
    expect(plan.variantsToCreate).toHaveLength(5)
    expect(plan.requiresForce).toBe(false)
  })
})

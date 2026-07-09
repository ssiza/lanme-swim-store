import {
  buildPlannedPresetVariants,
  generatePresetVariantSku,
  getProductVariantPreset,
  hasOnlyDefaultVariants,
  hasRealVariants,
} from "../product-variant-presets"
import { buildProductVariantPresetPlan } from "../product-variant-planning"

describe("product variant presets", () => {
  it("builds shorts size SKUs from product handle", () => {
    expect(generatePresetVariantSku("fanarc-denim-short", "XL")).toBe(
      "FANARC-DENIM-SHORT-XL"
    )
    expect(generatePresetVariantSku("fanarc-denim-short", "2XL")).toBe(
      "FANARC-DENIM-SHORT-2XL"
    )
  })

  it("exposes the shorts sizes preset", () => {
    const preset = getProductVariantPreset("shorts-sizes")

    expect(preset.optionTitle).toBe("Size")
    expect(preset.values).toEqual(["XS", "S", "M", "L", "XL", "2XL"])
  })

  it("plans one variant per preset value", () => {
    const planned = buildPlannedPresetVariants(
      {
        title: "Fanarc Denim Short",
        handle: "fanarc-denim-short",
      },
      getProductVariantPreset("shorts-sizes")
    )

    expect(planned).toHaveLength(6)
    expect(planned.map((variant) => variant.sku)).toEqual([
      "FANARC-DENIM-SHORT-XS",
      "FANARC-DENIM-SHORT-S",
      "FANARC-DENIM-SHORT-M",
      "FANARC-DENIM-SHORT-L",
      "FANARC-DENIM-SHORT-XL",
      "FANARC-DENIM-SHORT-2XL",
    ])
  })
})

describe("product variant preset planning", () => {
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

  it("detects default-only products", () => {
    expect(hasOnlyDefaultVariants(defaultProduct)).toBe(true)
    expect(hasRealVariants(defaultProduct)).toBe(false)
  })

  it("plans replacement variants for default-only products", () => {
    const plan = buildProductVariantPresetPlan({
      product: defaultProduct,
      preset: getProductVariantPreset("shorts-sizes"),
      force: false,
    })

    expect(plan.skip).toBe(false)
    expect(plan.defaultOnly).toBe(true)
    expect(plan.variantsToCreate).toHaveLength(6)
    expect(plan.variantIdsToDelete).toEqual(["variant_default"])
    expect(plan.requiresForce).toBe(true)
    expect(plan.pricesToCopy).toEqual([
      { amount: 4900, currency_code: "usd" },
    ])
  })

  it("skips real-variant products unless force is passed", () => {
    const product = {
      ...defaultProduct,
      variants: [
        {
          id: "variant_s",
          title: "S",
          options: [{ value: "S", option: { title: "Size" } }],
          prices: [{ amount: 4900, currency_code: "usd" }],
        },
      ],
    }

    const skipped = buildProductVariantPresetPlan({
      product,
      preset: getProductVariantPreset("shorts-sizes"),
      force: false,
    })

    expect(skipped.skip).toBe(true)

    const forced = buildProductVariantPresetPlan({
      product,
      preset: getProductVariantPreset("shorts-sizes"),
      force: true,
    })

    expect(forced.skip).toBe(false)
    expect(forced.variantsToCreate.map((variant) => variant.optionValue)).toEqual(
      ["XS", "M", "L", "XL", "2XL"]
    )
  })
})

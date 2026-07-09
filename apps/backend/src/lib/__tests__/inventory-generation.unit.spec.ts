import {
  generateInventoryTitle,
  generateVariantSku,
  getMeaningfulVariantOptions,
  planVariantInventory,
  slugToSkuPart,
} from "../inventory-generation"

describe("inventory generation helpers", () => {
  it("builds SKU parts from handles and option values", () => {
    expect(slugToSkuPart("fanarc-denim-short")).toBe("FANARC-DENIM-SHORT")
    expect(
      generateVariantSku("fanarc-denim-short", {
        title: "XL",
        options: [{ value: "XL", option: { title: "Size" } }],
      })
    ).toBe("FANARC-DENIM-SHORT-XL")
  })

  it("uses DEFAULT when only the default option exists", () => {
    expect(
      generateVariantSku("fanarc-denim-short", {
        title: "Default variant",
        options: [
          {
            value: "Default option value",
            option: { title: "Default option" },
          },
        ],
      })
    ).toBe("FANARC-DENIM-SHORT-DEFAULT")
  })

  it("ignores default option values when building meaningful options", () => {
    expect(
      getMeaningfulVariantOptions([
        {
          value: "Default option value",
          option: { title: "Default option" },
        },
        { value: "XL", option: { title: "Size" } },
      ])
    ).toHaveLength(1)
  })

  it("plans stock updates when inventory exists with zero stock", () => {
    const plan = planVariantInventory({
      product: {
        title: "Fanarc Denim Short",
        handle: "fanarc-denim-short",
      },
      variant: {
        id: "variant_123",
        title: "XL",
        sku: null,
        manage_inventory: false,
        inventory_items: [
          {
            inventory: {
              id: "iitem_123",
              location_levels: [
                {
                  id: "ilevel_123",
                  location_id: "sloc_123",
                  stocked_quantity: 0,
                },
              ],
            },
          },
        ],
      },
      locationId: "sloc_123",
    })

    expect(plan?.skip).toBe(false)
    expect(plan?.updateStockLevel).toBe(true)
    expect(plan?.createInventoryItem).toBe(false)
    expect(plan?.sku).toBe("FANARC-DENIM-SHORT-XL")
    expect(generateInventoryTitle("Fanarc Denim Short", { title: "XL" })).toBe(
      "Fanarc Denim Short - XL"
    )
  })

  it("skips variants that already have stock at the location", () => {
    const plan = planVariantInventory({
      product: {
        title: "Fanarc Denim Short",
        handle: "fanarc-denim-short",
      },
      variant: {
        id: "variant_123",
        sku: "FANARC-DENIM-SHORT-XL",
        inventory_items: [
          {
            inventory: {
              id: "iitem_123",
              location_levels: [
                {
                  id: "ilevel_123",
                  location_id: "sloc_123",
                  stocked_quantity: 25,
                },
              ],
            },
          },
        ],
      },
      locationId: "sloc_123",
    })

    expect(plan?.skip).toBe(true)
  })
})

import { SITE_NAME } from "@lib/constants/site"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { logPageRender } from "@lib/util/storefront-fetch-log"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

export const revalidate = 60

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct | null | undefined,
  selectedVariantId?: string
) {
  if (!product) {
    return null
  }

  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle({
    handle,
    regionId: region.id,
    countryCode,
  })

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | ${SITE_NAME}`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | ${SITE_NAME}`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { countryCode, handle } = params
  const route = `/${countryCode}/products/${handle}`
  const region = await getRegion(countryCode)

  logPageRender(route, {
    step: "product_detail_start",
    hasRegion: Boolean(region),
    regionId: region?.id,
  })

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle({
    handle,
    regionId: region.id,
    countryCode,
  })

  if (!product) {
    notFound()
  }

  const images = getImagesForVariant(product, searchParams.v_id)

  logPageRender(route, {
    step: "product_detail_ready",
    regionId: region.id,
    productId: product.id,
  })

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={countryCode}
      images={images ?? []}
    />
  )
}

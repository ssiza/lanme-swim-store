import { SITE_NAME } from "@lib/constants/site"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getCategoryPath } from "@lib/util/category-path"

export const revalidate = 60

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const route = `/${params.countryCode}/categories/${params.category.join("/")}`

  try {
    const productCategory = await getCategoryByHandle(params.category, route)

    if (!productCategory) {
      notFound()
    }

    const title = `${productCategory.name} | ${SITE_NAME}`
    const description = productCategory.description ?? `${title} category.`

    return {
      title,
      description,
      alternates: {
        canonical: getCategoryPath(productCategory),
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const route = `/${params.countryCode}/categories/${params.category.join("/")}`

  const productCategory = await getCategoryByHandle(params.category, route)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}

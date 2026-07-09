type FetchLogMeta = Record<string, unknown>

export type ProductQueryLogContext = {
  route: string
  countryCode?: string
  regionId?: string
  salesChannelId?: string | string[] | null
  collectionId?: string | string[] | null
  collectionHandle?: string | null
  categoryId?: string | string[] | null
  categoryHandle?: string | null
  tagId?: string | string[] | null
  limit?: number
  offset?: number
  returnedCount?: number
  totalCount?: number
}

const envSnapshot = () => ({
  backendUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "unset",
  hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
})

export function logFetchStart(name: string, meta?: FetchLogMeta) {
  console.log(
    JSON.stringify({
      event: "storefront.fetch.start",
      name,
      ...envSnapshot(),
      ...meta,
    })
  )
}

export function logFetchEnd(
  name: string,
  meta?: FetchLogMeta & { ok?: boolean }
) {
  console.log(
    JSON.stringify({
      event: "storefront.fetch.end",
      name,
      ok: meta?.ok ?? true,
      ...envSnapshot(),
      ...meta,
    })
  )
}

export function logFetchError(
  name: string,
  error: unknown,
  meta?: FetchLogMeta
) {
  console.error(
    JSON.stringify({
      event: "storefront.fetch.error",
      name,
      ...envSnapshot(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    })
  )
}

export function logPageRender(route: string, meta?: FetchLogMeta) {
  console.log(
    JSON.stringify({
      event: "storefront.page",
      route,
      ...envSnapshot(),
      ...meta,
    })
  )
}

export function logProductQuery(
  phase: "start" | "end" | "error",
  context: ProductQueryLogContext & { error?: string }
) {
  const event =
    phase === "start"
      ? "storefront.product_query.start"
      : phase === "end"
        ? "storefront.product_query.end"
        : "storefront.product_query.error"

  const payload = {
    event,
    route: context.route,
    countryCode: context.countryCode ?? null,
    regionId: context.regionId ?? null,
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
    salesChannelId: context.salesChannelId ?? null,
    collection_id: context.collectionId ?? null,
    collection_handle: context.collectionHandle ?? null,
    category_id: context.categoryId ?? null,
    category_handle: context.categoryHandle ?? null,
    tag_id: context.tagId ?? null,
    limit: context.limit ?? null,
    offset: context.offset ?? null,
    returnedCount: context.returnedCount ?? null,
    totalCount: context.totalCount ?? null,
    ...(context.error ? { error: context.error } : {}),
  }

  if (phase === "error") {
    console.error(JSON.stringify(payload))
  } else {
    console.log(JSON.stringify(payload))
  }
}

export function extractProductQueryFilters(
  query: Record<string, unknown> | undefined
): Pick<
  ProductQueryLogContext,
  "collectionId" | "categoryId" | "tagId" | "limit" | "offset"
> {
  if (!query) {
    return {}
  }

  return {
    collectionId: (query.collection_id as string | string[] | undefined) ?? null,
    categoryId: (query.category_id as string | string[] | undefined) ?? null,
    tagId: (query.tag_id as string | string[] | undefined) ?? null,
    limit: typeof query.limit === "number" ? query.limit : undefined,
    offset: typeof query.offset === "number" ? query.offset : undefined,
  }
}

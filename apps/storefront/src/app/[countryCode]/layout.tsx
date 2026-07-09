import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getDefaultCountryCode } from "@lib/constants/region"
import { getRegion } from "@lib/data/regions"
import {
  isCountryPathSegment,
  stripLeadingCountrySegment,
} from "@lib/util/region-resolution"

export default async function CountryCodeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const normalizedCountryCode = countryCode?.toLowerCase()
  const fallbackCountry = getDefaultCountryCode()
  const pathname = (await headers()).get("x-pathname") ?? ""

  if (!isCountryPathSegment(normalizedCountryCode)) {
    const rest = stripLeadingCountrySegment(pathname)
    redirect(`/${fallbackCountry}${rest}`)
  }

  const region = await getRegion(normalizedCountryCode)

  if (!region && normalizedCountryCode !== fallbackCountry) {
    const rest = stripLeadingCountrySegment(pathname)
    redirect(`/${fallbackCountry}${rest}`)
  }

  return children
}

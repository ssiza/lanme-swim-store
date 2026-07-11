import { SITE_DESCRIPTION, SITE_NAME } from "@lib/constants/site"
import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"
import "styles/globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    title: SITE_NAME,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${outfit.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased text-brand-ink">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}

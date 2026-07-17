"use client"

import { clx } from "@modules/common/components/ui"
import Image from "next/image"

type EditorialImageProps = {
  desktopSrc: string
  mobileSrc?: string | null
  alt: string
  priority?: boolean
  className?: string
  imageClassName?: string
  sizes?: string
}

/**
 * Full-bleed responsive photography with subtle hover zoom.
 * Desktop/mobile art-direction via CSS visibility (avoids layout shift).
 */
const EditorialImage = ({
  desktopSrc,
  mobileSrc = null,
  alt,
  priority = false,
  className,
  imageClassName,
  sizes = "100vw",
}: EditorialImageProps) => {
  const mobile = mobileSrc || desktopSrc
  const shared = clx(
    "object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.03]",
    imageClassName
  )

  return (
    <div className={clx("absolute inset-0 overflow-hidden", className)}>
      <Image
        src={mobile}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={clx(shared, "small:hidden")}
      />
      <Image
        src={desktopSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={clx(shared, "hidden small:block")}
      />
    </div>
  )
}

export default EditorialImage

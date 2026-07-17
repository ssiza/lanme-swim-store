import { resolveResponsiveImagePair } from "@lib/util/responsive-image"
import { clx } from "@modules/common/components/ui"

type EditorialImageProps = {
  desktopSrc?: string | null
  mobileSrc?: string | null
  alt: string
  priority?: boolean
  className?: string
  imageClassName?: string
}

/**
 * Full-bleed CMS photography with desktop/mobile art direction.
 * Either image is enough — the missing viewport falls back to the other.
 */
const EditorialImage = ({
  desktopSrc = null,
  mobileSrc = null,
  alt,
  priority = false,
  className,
  imageClassName,
}: EditorialImageProps) => {
  const pair = resolveResponsiveImagePair(desktopSrc, mobileSrc)

  if (!pair) {
    return null
  }

  const shared = clx(
    "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.03]",
    imageClassName
  )

  return (
    <div className={clx("absolute inset-0 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pair.mobile}
        alt={alt}
        className={clx(shared, "small:hidden")}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pair.desktop}
        alt={alt}
        className={clx(shared, "hidden small:block")}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </div>
  )
}

export default EditorialImage

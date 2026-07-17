import React from "react"

import { IconProps } from "types/icon"

const ShoppingBag: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...attributes}
    >
      <path
        d="M5.5 6.5H14.5L15.25 16.25C15.28 16.66 14.95 17 14.54 17H5.46C5.05 17 4.72 16.66 4.75 16.25L5.5 6.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 6.5V5.25C7.5 3.87 8.62 2.75 10 2.75C11.38 2.75 12.5 3.87 12.5 5.25V6.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShoppingBag

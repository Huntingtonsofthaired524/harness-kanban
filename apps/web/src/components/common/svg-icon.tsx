import Image from 'next/image'

import { cn } from '@/lib/shadcn/utils'
import type { ComponentProps, FC } from 'react'

interface SvgIconProps extends Omit<ComponentProps<typeof Image>, 'src'> {
  src: string
  alt: string
  size?: number
}

export const SvgIcon: FC<SvgIconProps> = ({ src, alt, size = 16, className, ...props }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('inline-block align-middle', className)}
      {...props}
    />
  )
}

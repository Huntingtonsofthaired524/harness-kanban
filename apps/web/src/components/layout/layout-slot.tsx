import React from 'react'

import { cn } from '@/lib/shadcn/utils'

export type LayoutSlotProps = React.HTMLAttributes<HTMLDivElement>

export const LayoutSlot: React.FC<LayoutSlotProps> = ({ className, ...props }) => {
  return <div className={cn('min-w-0', '', className)} {...props} />
}

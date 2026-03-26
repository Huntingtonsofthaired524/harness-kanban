import React from 'react'

import { cn } from '@/lib/shadcn/utils'

export type ComponentSlotProps = React.HTMLAttributes<HTMLDivElement>

export const ComponentSlot: React.FC<ComponentSlotProps> = ({ className, ...props }) => {
  return <div className={cn('flex items-center justify-center rounded-none', className)} {...props} />
}

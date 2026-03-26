import { format } from 'date-fns'

import { cn } from '@/lib/shadcn/utils'
import type { RendererComponent } from '@/property/types/property-types'

export const ReadonlyDatetime: RendererComponent<number | null> = ({ value }) => {
  return (
    <div className={cn('text-sm')}>
      {value !== null && value !== undefined ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '-'}
    </div>
  )
}

'use client'

import type { TableCellRendererComponent } from '@/property/types/property-types'

export const TitleTableCell: TableCellRendererComponent = ({ value }) => {
  return (
    <span className="text-foreground text-sm font-medium leading-tight">{typeof value === 'string' ? value : '-'}</span>
  )
}

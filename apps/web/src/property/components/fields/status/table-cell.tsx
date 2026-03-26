'use client'

import { TableCellRendererComponent } from '@/property/types/property-types'
import { getStatusDefinition, StatusIcon } from './status-utils'

export const StatusTableCell: TableCellRendererComponent = ({ value, meta }) => {
  const statusId = typeof value === 'string' ? value : undefined
  const status = getStatusDefinition(meta, statusId)

  return (
    <div className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs">
      <StatusIcon iconName={status?.icon} statusId={statusId} className="size-3.5" />
      <span className="max-w-[120px] truncate leading-none">{status?.label ?? 'Status'}</span>
    </div>
  )
}

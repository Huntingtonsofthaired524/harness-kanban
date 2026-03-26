'use client'

import { RendererComponent } from '@/property/types/property-types'
import { getStatusDefinition, StatusIcon } from './status-utils'

export const ReadonlyStatus: RendererComponent = ({ value, meta, disabled }) => {
  const statusId = typeof value === 'string' ? value : undefined
  const status = getStatusDefinition(meta, statusId)

  return (
    <div
      className={`inline-flex min-h-8 max-w-full select-none items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
        disabled ? 'text-muted-foreground' : ''
      }`}>
      <StatusIcon iconName={status?.icon} statusId={statusId} />
      <span className="truncate leading-none">{status?.label ?? meta.display?.placeholder ?? 'Status'}</span>
    </div>
  )
}

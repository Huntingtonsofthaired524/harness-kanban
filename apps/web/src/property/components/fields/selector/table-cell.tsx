'use client'

import React, { cloneElement, isValidElement } from 'react'

import { usePropertyOptions } from '@/property/hooks/use-property-options'
import { TableCellRendererComponent } from '@/property/types/property-types'

export const IconOnlySelectorTableCell: TableCellRendererComponent = ({ value, meta }) => {
  const propertyId = meta.core.propertyId
  const { data: options } = usePropertyOptions(propertyId)

  const matched = options?.find(opt => opt.value === value)
  const icon = matched?.icon ?? meta.display?.placeholderIcon ?? null

  return <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
}

export const CapsuleSelectorTableCell: TableCellRendererComponent = ({ value, meta }) => {
  const propertyId = meta.core.propertyId
  const { data: options } = usePropertyOptions(propertyId)

  const matched = options?.find(opt => opt.value === value)
  if (!matched) return null

  const icon = isValidElement(matched.icon)
    ? cloneElement(matched.icon as React.ReactElement, {
        className: 'w-3.5 h-3.5 shrink-0 text-muted-foreground',
      })
    : null

  return (
    <div className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-sm">
      {icon}
      <span className="truncate leading-none">{matched.label}</span>
    </div>
  )
}

'use client'

import React, { cloneElement, isValidElement, useEffect, useState } from 'react'

import { cn } from '@/lib/shadcn/utils'
import { getPropertyRendererEntry } from '@/property/registry/property-registry'
import type { PropertyOptionItem, RendererComponent } from '@/property/types/property-types'

export const ReadonlySelector: RendererComponent = ({ value, disabled, meta }) => {
  const [options, setOptions] = useState<PropertyOptionItem[]>([])
  const placeholder = meta.display?.placeholder ?? '-'
  const propertyId = meta.core.propertyId

  useEffect(() => {
    const entry = getPropertyRendererEntry(propertyId)
    const loader = entry?.optionsLoader
    if (typeof loader === 'function') {
      Promise.resolve(loader()).then(setOptions)
    }
  }, [propertyId])

  const selected = options.find(opt => opt.value === value)
  const icon = selected?.icon ?? meta.display?.placeholderIcon ?? null
  const iconClassName = isValidElement(icon) ? (icon.props as { className?: string }).className : undefined
  const normalizedIcon = isValidElement(icon)
    ? cloneElement(icon as React.ReactElement<{ className?: string }>, {
        className: cn('size-4 shrink-0 text-muted-foreground', iconClassName),
      })
    : icon

  return (
    <div
      className={cn(
        'inline-flex h-9 w-[var(--select-options-width)] max-w-full select-none items-center gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm',
        disabled && 'text-muted-foreground',
      )}>
      {normalizedIcon}
      <span className="truncate leading-none">{selected?.label ?? placeholder}</span>
    </div>
  )
}

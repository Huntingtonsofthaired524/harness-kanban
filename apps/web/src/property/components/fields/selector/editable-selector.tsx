'use client'

import { CircleX } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/shadcn/utils'
import { getPropertyRendererEntry } from '@/property/registry/property-registry'
import type { PropertyOptionItem, PropertyValueType, RendererComponent } from '@/property/types/property-types'

const UNSET_VALUE = '__unset'

export const EditableSelector: RendererComponent = ({ value, onChange, disabled, meta }) => {
  const [options, setOptions] = useState<PropertyOptionItem[] | null>(null)
  const placeholder = meta.display?.placeholder ?? 'Select...'
  const placeholderWithIcon = (
    <span className="text-muted-foreground flex min-w-0 items-center gap-2">
      {meta?.display?.placeholderIcon}
      <span className="truncate">{placeholder}</span>
    </span>
  )
  const label = meta.display?.label
  const nullable = !meta.core.required
  const propertyId = meta.core.propertyId

  useEffect(() => {
    const entry = getPropertyRendererEntry(propertyId)
    const loader = entry?.optionsLoader
    if (typeof loader === 'function') {
      Promise.resolve(loader()).then(setOptions)
    } else {
      setOptions([])
    }
  }, [propertyId])

  const parseValue = (val: string): PropertyValueType => {
    if (nullable && val === UNSET_VALUE) return null
    // Check if the current value is a number to maintain type consistency
    const currentValueIsNumber =
      typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value !== '')

    if (currentValueIsNumber) {
      const parsed = Number(val)
      if (!isNaN(parsed)) return parsed
    }
    return val
  }

  if (options === null) {
    return null
  }

  const selectValue = value !== undefined && value !== null && value !== '' ? String(value) : undefined

  return (
    <Select
      key={selectValue ?? UNSET_VALUE}
      value={selectValue}
      onValueChange={val => {
        try {
          const parsed = parseValue(val)
          onChange?.(parsed)
        } catch {
          // TODO: keep ignore or toast.error
          toast.error(`Value: ${val} is invalid for ${label}`)
        }
      }}
      disabled={disabled}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 bg-transparent',
          'border-transparent shadow-none',
          'hover:border-border focus-visible:border-border hover:shadow-sm focus-visible:shadow-sm focus-visible:ring-[1px]',
          '[&>svg]:hidden',
          'hover:cursor-pointer',
          'w-[var(--select-options-width)]',
        )}>
        <SelectValue placeholder={placeholderWithIcon} />
      </SelectTrigger>
      <SelectContent className="whitespace-nowrap" sideOffset={4}>
        <SelectGroup>
          {nullable && (
            <SelectItem value={UNSET_VALUE} className="text-muted-foreground flex items-center gap-2 italic">
              <CircleX className="h-4 w-4" />
              None
            </SelectItem>
          )}
          {options.map(opt => (
            <SelectItem key={String(opt.value)} value={String(opt.value)} className="flex items-center gap-2">
              {opt.icon}
              <span className="truncate whitespace-nowrap break-keep">{opt.label}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

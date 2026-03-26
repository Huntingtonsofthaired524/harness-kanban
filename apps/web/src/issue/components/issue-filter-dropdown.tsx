'use client'

import { ListFilter, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/shadcn/utils'
import { getStatusConfig, StatusIcon } from '@/property/components/fields/status/status-utils'
import { getPropertyRendererEntry } from '@/property/registry/property-registry'
import { PropertyFilterInputType, PropertyMeta, PropertyOptionItem } from '@/property/types/property-types'
import { FilterOperator } from '@repo/shared/property/constants'
import { FilterCondition } from '@repo/shared/property/types'

interface FilterDropdownProps {
  columns: PropertyMeta[]
  value: FilterCondition[]
  onChange: (filters: FilterCondition[]) => void
}

export const IssueFilterDropdown: React.FC<FilterDropdownProps> = ({ columns, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterCondition[]>(value)

  const filterable = useMemo(() => columns.filter(c => c.query?.filter), [columns])

  const updateFilter = (propertyId: string, updated: FilterCondition[]) => {
    const rest = filters.filter(f => f.propertyId !== propertyId)
    setFilters([...rest, ...updated])
  }

  const removeFilter = (propertyId: string) => {
    setFilters(prev => prev.filter(f => f.propertyId !== propertyId))
  }

  const apply = () => {
    const flattened = filters.filter(f => {
      if (typeof f.operand === 'string') return f.operand.trim() !== ''
      return true
    })
    onChange(flattened)
    setOpen(false)
  }

  useEffect(() => {
    if (open) {
      setFilters(value)
    }
  }, [open, value])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 cursor-pointer rounded-sm">
          <ListFilter className="h-4 w-4" />
          Filter {value.length > 0 && `(${value.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="z-50 max-h-[calc(100vh-64px)] min-w-[200px] max-w-[calc(100vw-32px)] space-y-2 overflow-y-auto p-2">
        <div className="text-muted-foreground mb-2 text-xs font-medium">Filters</div>
        <div className="space-y-1">
          {filterable.map(meta => {
            const current = filters.filter(f => f.propertyId === meta.core.propertyId)
            const operator = meta.query!.filter!.operators[0]
            if (!operator) return null
            const inputType = meta.query!.filter!.input

            if (inputType === PropertyFilterInputType.Text) {
              return (
                <div key={meta.core.propertyId} className="relative">
                  <Input
                    className="h-8 pr-8"
                    value={(current[0]?.operand as string) ?? ''}
                    onKeyDown={e => e.stopPropagation()}
                    onChange={e => {
                      const trimmed = e.target.value.trim()
                      if (trimmed === '') {
                        removeFilter(meta.core.propertyId)
                      } else {
                        updateFilter(meta.core.propertyId, [
                          {
                            propertyId: meta.core.propertyId,
                            propertyType: meta.core.type,
                            operator,
                            operand: trimmed,
                          },
                        ])
                      }
                    }}
                    placeholder={meta.display?.label ?? ''}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-2 h-4 w-4"
                    onClick={() => removeFilter(meta.core.propertyId)}>
                    <X className="text-muted-foreground h-4 w-4" />
                  </Button>
                </div>
              )
            }

            if (inputType === PropertyFilterInputType.MultiSelect) {
              const selectedValues = current.flatMap(condition => {
                if (Array.isArray(condition.operand)) {
                  return condition.operand.filter(
                    (operand): operand is string | number => typeof operand === 'string' || typeof operand === 'number',
                  )
                }

                if (typeof condition.operand === 'string' || typeof condition.operand === 'number') {
                  return [condition.operand]
                }

                return []
              })

              return (
                <MultiSelectFilterRow
                  key={meta.core.propertyId}
                  meta={meta}
                  value={selectedValues}
                  operator={operator}
                  onChange={vals => {
                    if (vals.length === 0) {
                      removeFilter(meta.core.propertyId)
                    } else {
                      updateFilter(meta.core.propertyId, [
                        {
                          propertyId: meta.core.propertyId,
                          propertyType: meta.core.type,
                          operator,
                          operand: vals,
                        },
                      ])
                    }
                  }}
                />
              )
            }

            return null
          })}
        </div>
        <Separator />
        <div className="mt-4 flex items-center justify-start space-x-2 px-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters([])
              onChange([])
              setOpen(false)
            }}
            className="text-muted-foreground justify-start text-xs">
            Reset
          </Button>
          <div className="flex-1" />
          <Button size="sm" className="text-xs" onClick={apply}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface MultiSelectFilterRowProps {
  meta: PropertyMeta
  value: (string | number)[]
  onChange: (val: (string | number)[]) => void
  operator: FilterOperator
}

const MultiSelectFilterRow: React.FC<MultiSelectFilterRowProps> = ({ meta, value, onChange }) => {
  const [options, setOptions] = useState<PropertyOptionItem[]>([])

  const toggle = (val: string | number) => {
    const next = value.includes(val) ? value.filter(v => v !== val) : [...value, val]
    onChange(next)
  }

  useEffect(() => {
    if (meta.core.type === 'status') {
      const config = getStatusConfig(meta)
      setOptions(
        config?.statuses.map(status => ({
          value: status.id,
          label: status.label,
          icon: <StatusIcon iconName={status.icon} className="text-muted-foreground size-4" />,
        })) ?? [],
      )
      return
    }

    const entry = getPropertyRendererEntry(meta.core.propertyId)
    const loader = entry?.optionsLoader
    if (!loader) {
      setOptions([])
      return
    }

    const result = loader()
    if (Array.isArray(result)) {
      setOptions(result)
      return
    }

    let cancelled = false
    result.then(nextOptions => {
      if (!cancelled) {
        setOptions(nextOptions)
      }
    })

    return () => {
      cancelled = true
    }
  }, [meta])

  return (
    <DropdownMenu>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-muted-foreground hover:bg-muted h-8 w-full justify-between rounded-sm px-2 py-1 text-left text-sm">
          {meta.display?.label ?? meta.core.propertyId}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-[280px] w-[240px] overflow-y-auto px-1 py-1">
          {options.map(opt => {
            const selected = value.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={cn(
                  'hover:bg-muted group flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-left text-sm',
                  selected ? 'bg-muted font-medium' : 'text-muted-foreground',
                )}>
                <Checkbox className="h-4 w-4" checked={selected} onCheckedChange={() => toggle(opt.value)} />
                {opt.icon}
                {opt.label}
              </div>
            )
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenu>
  )
}

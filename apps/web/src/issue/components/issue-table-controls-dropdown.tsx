'use client'

import { ArrowDown01, ArrowDownUp, ArrowUp01 } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PropertyMeta } from '@/property/types/property-types'
import { SortParam } from '@repo/shared/property/types'

interface SortOption {
  id: string
  label: string
}

interface TableControlsDropdownProps {
  columns: PropertyMeta[]
  visibleColumns: string[]
  sort: SortParam | null
  onChangeVisibleColumns: (ids: string[]) => void
  onChangeSort: (sort: SortParam | null) => void
  onReset: () => void
}

export const IssueTableControlsDropdown: React.FC<TableControlsDropdownProps> = ({
  columns,
  visibleColumns,
  sort,
  onChangeVisibleColumns,
  onChangeSort,
  onReset,
}) => {
  const toggleColumn = (id: string) => {
    const set = new Set(visibleColumns)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChangeVisibleColumns(Array.from(set))
  }

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => (a?.table?.order ?? 0) - (b?.table?.order ?? 0)),
    [columns],
  )

  const sortableOptions: SortOption[] = useMemo(
    () =>
      sortedColumns
        .filter(c => c.table?.sortable)
        .map(c => ({
          id: c.core.propertyId,
          label: c.display?.label ?? c.core.propertyId,
        })),
    [sortedColumns],
  )

  const sortId = sort?.id
  const sortDesc = sort?.desc ?? false

  const handleChangeSortId = (id: string) => {
    const selected = sortableOptions.find(opt => opt.id === id)
    if (selected) {
      onChangeSort({ id, desc: false })
    }
  }

  const handleToggleSortDirection = () => {
    if (!sortId) return
    onChangeSort({ id: sortId, desc: !sortDesc })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 rounded-sm text-sm">
          <ArrowDownUp className="h-4 w-4" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="space-y-4">
          {/* Ordering */}
          <div className="space-y-2">
            <div className="text-muted-foreground mb-2 text-xs font-medium">Ordering</div>
            <div className="flex items-center gap-2">
              <Select value={sortId ?? ''} onValueChange={handleChangeSortId}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortableOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                disabled={!sortId}
                onClick={handleToggleSortDirection}
                className="h-8 w-8">
                {sortDesc ? <ArrowUp01 className="h-4 w-4" /> : <ArrowDown01 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Display Properties */}
          <div className="space-y-2">
            <div className="text-muted-foreground mb-2 text-xs font-medium">Display Properties</div>
            <div className="flex flex-wrap gap-2">
              {sortedColumns.map(field => {
                const id = field.core.propertyId
                const label = field.display?.label ?? id
                const active = visibleColumns.includes(id)

                return (
                  <Button
                    key={id}
                    size="sm"
                    variant={active ? 'outline' : 'ghost'}
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleColumn(id)}>
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          <Button variant="outline" size="sm" onClick={onReset} className="text-muted-foreground justify-start text-xs">
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

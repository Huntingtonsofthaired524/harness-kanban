'use client'

import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { IssueFilterDropdown } from '@/issue/components/issue-filter-dropdown'
import { IssueTableControlsDropdown } from '@/issue/components/issue-table-controls-dropdown'
import { PropertyMeta } from '@/property/types/property-types'
import { FilterCondition, SortParam } from '@repo/shared/property/types'

interface IssueListActionsProps {
  columns: PropertyMeta[]
  visibleColumns: string[]
  onChangeVisibleColumns: (ids: string[]) => void
  sort: SortParam | null
  onChangeSort: (value: SortParam | null) => void
  onReset: () => void
  filters: FilterCondition[]
  onChangeFilters: (filters: FilterCondition[]) => void
  createHref?: string
}

export const IssueListActions: React.FC<IssueListActionsProps> = ({
  columns,
  visibleColumns,
  onChangeVisibleColumns,
  sort,
  onChangeSort,
  onReset,
  filters,
  onChangeFilters,
  createHref = '/issues/new',
}) => {
  return (
    <div className="container mx-auto flex max-w-6xl items-center justify-between">
      <div className="flex items-center gap-2">
        <IssueFilterDropdown columns={columns} value={filters} onChange={onChangeFilters} />
      </div>
      <div className="flex items-center gap-2">
        <IssueTableControlsDropdown
          columns={columns}
          visibleColumns={visibleColumns}
          onChangeVisibleColumns={onChangeVisibleColumns}
          sort={sort}
          onChangeSort={onChangeSort}
          onReset={onReset}
        />
        <Link href={createHref}>
          <Button size="sm" className="rounded-sm">
            Create
          </Button>
        </Link>
      </div>
    </div>
  )
}

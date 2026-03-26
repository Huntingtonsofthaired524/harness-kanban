'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { LayoutSlot } from '@/components/layout/layout-slot'
import { IssueListActions } from '@/issue/components/issue-list-actions'
import { IssueTableRow } from '@/issue/components/issue-table-row'
import { useInfiniteIssueList } from '@/issue/hooks/use-issue-list'
import { IssueRowType } from '@/issue/types/issue-types'
import { buildIssueCreateHref, buildIssueDetailHref, IssueNavigationContext } from '@/issue/utils/navigation-context'
import { useIssuePropertyMetas } from '@/property/hooks/use-issue-property-metas'
import { PropertyMeta, PropertyTableColumnLayout } from '@/property/types/property-types'
import { FilterCondition, SortParam } from '@repo/shared/property/types'
import type { ReadonlyURLSearchParams } from 'next/navigation'

interface IssueListPageViewProps {
  columns: PropertyMeta[]
  visibleColumns: string[]
  sort: SortParam | null
  filters: FilterCondition[]
  rows: IssueRowType[]
  filteredColumns: PropertyMeta[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  onChangeVisibleColumns: (ids: string[]) => void
  onChangeSort: (sort: SortParam | null) => void
  onChangeFilters: (filters: FilterCondition[]) => void
  onReset: () => void
  loaderRef: React.Ref<HTMLDivElement>
  createHref: string
  getIssueHref: (issueId: number) => string
}

export const IssueListPageView: React.FC<IssueListPageViewProps> = ({
  columns,
  visibleColumns,
  sort,
  filters,
  rows,
  filteredColumns,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onChangeVisibleColumns,
  onChangeSort,
  onChangeFilters,
  onReset,
  loaderRef,
  createHref,
  getIssueHref,
}) => {
  return (
    <>
      <div className="bg-background sticky top-0 z-30 w-full border-b">
        <LayoutSlot className="container mx-auto flex h-[var(--navbar-height)] max-w-6xl items-center px-2 md:px-6">
          <LayoutSlot className="flex h-[var(--navbar-height)] flex-1 items-center">
            <IssueListActions
              columns={columns}
              visibleColumns={visibleColumns}
              onChangeVisibleColumns={onChangeVisibleColumns}
              sort={sort}
              onChangeSort={onChangeSort}
              onReset={onReset}
              filters={filters}
              onChangeFilters={onChangeFilters}
              createHref={createHref}
            />
          </LayoutSlot>
        </LayoutSlot>
      </div>

      <div className="container mx-auto w-full max-w-6xl px-2 py-4 md:px-6">
        {isLoading ? (
          <GlobalLoading />
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center border">
            No issues found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border">
            <div className="flex flex-col divide-y">
              {rows.map(r => (
                <IssueTableRow key={r.id} row={{ ...r, _id: r.id }} metas={filteredColumns} href={getIssueHref(r.id)} />
              ))}
              <div ref={loaderRef} className="text-muted-foreground py-4 text-center text-sm">
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Scroll to load more' : 'No more data'}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

interface IssueListContentProps {
  searchParams: URLSearchParams | ReadonlyURLSearchParams
  onReplaceSearchParams: (nextSearchParams: URLSearchParams) => void
  defaultFilters?: FilterCondition[]
  createHref?: string
  issueNavigationContext?: IssueNavigationContext | null
}

const parseSortParam = (raw: string | null): SortParam | null => {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null
  } catch {
    return null
  }
}

const parseFilterParams = (raw: string | null): FilterCondition[] => {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const IssueListContent: React.FC<IssueListContentProps> = ({
  searchParams,
  onReplaceSearchParams,
  defaultFilters = [],
  createHref = buildIssueCreateHref(null),
  issueNavigationContext = null,
}) => {
  const fields = useIssuePropertyMetas()
  const isFieldsLoaded = fields.length > 0

  const columns = useMemo<PropertyMeta[]>(() => {
    const idMeta: PropertyMeta = {
      core: { type: 'number', propertyId: '_id' },
      display: { label: 'ID' },
      table: { layout: PropertyTableColumnLayout.LEFT, sortable: false, order: 2 },
    }
    return [idMeta, ...fields.filter(m => m.table?.layout !== PropertyTableColumnLayout.HIDDEN)]
  }, [fields])

  const rawSort = searchParams.get('sort')
  const rawFilters = searchParams.get('filters')

  const sort = useMemo<SortParam | null>(() => parseSortParam(rawSort), [rawSort])

  const filters = useMemo<FilterCondition[]>(() => {
    if (rawFilters !== null) {
      return parseFilterParams(rawFilters)
    }

    return defaultFilters
  }, [defaultFilters, rawFilters])

  const [visibleColumns, setVisibleColumns] = useState<string[] | null>(null)

  const filteredColumns = useMemo<PropertyMeta[]>(() => {
    if (!visibleColumns) return []
    const s = new Set(visibleColumns)
    return columns.filter(c => s.has(c.core.propertyId))
  }, [columns, visibleColumns])

  const handleChangeSort = (newSort: SortParam | null) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (newSort) sp.set('sort', JSON.stringify([newSort]))
    else sp.delete('sort')
    sp.delete('page')
    onReplaceSearchParams(sp)
  }

  const handleChangeFilters = (newFilters: FilterCondition[]) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (newFilters.length) {
      sp.set('filters', JSON.stringify(newFilters))
    } else if (defaultFilters.length > 0) {
      sp.set('filters', JSON.stringify([]))
    } else {
      sp.delete('filters')
    }
    sp.delete('page')
    onReplaceSearchParams(sp)
  }

  const handleChangeVisibleColumns = (ids: string[]) => {
    setVisibleColumns(ids)
  }

  const handleReset = () => {
    setVisibleColumns(columns.map(c => c.core.propertyId))
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('sort')
    sp.delete('page')
    if (defaultFilters.length > 0) {
      sp.set('filters', JSON.stringify(defaultFilters))
    } else {
      sp.delete('filters')
    }
    onReplaceSearchParams(sp)
  }

  const apiSearchParams = useMemo(() => {
    const params = new URLSearchParams()
    const page = searchParams.get('page')
    const perPage = searchParams.get('perPage')

    if (page) {
      params.set('page', page)
    }
    if (perPage) {
      params.set('perPage', perPage)
    }
    if (sort) {
      params.set('sort', JSON.stringify([sort]))
    }
    if (rawFilters !== null || filters.length > 0) {
      params.set('filters', JSON.stringify(filters))
    }

    return params
  }, [filters, rawFilters, searchParams, sort])

  const { data, isLoading, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteIssueList(apiSearchParams)

  const loaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isFieldsLoaded && visibleColumns === null) {
      const initialVisibleColumns = columns.filter(m => m.table?.defaultVisible !== false).map(m => m.core.propertyId)
      setVisibleColumns(initialVisibleColumns)
    }
  }, [isFieldsLoaded, visibleColumns, columns])

  useEffect(() => {
    const el = loaderRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        fetchNextPage()
      }
    })

    observer.observe(el)

    if (el.getBoundingClientRect().top < window.innerHeight) {
      void fetchNextPage()
    }

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage])

  const rows = data?.pages.flatMap(p => p.rows) ?? []

  return (
    <IssueListPageView
      columns={columns}
      visibleColumns={visibleColumns ?? []}
      sort={sort}
      filters={filters}
      rows={rows}
      filteredColumns={filteredColumns}
      hasNextPage={Boolean(hasNextPage)}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading || isPending || !isFieldsLoaded || visibleColumns === null}
      onChangeVisibleColumns={handleChangeVisibleColumns}
      onChangeSort={handleChangeSort}
      onChangeFilters={handleChangeFilters}
      onReset={handleReset}
      loaderRef={loaderRef}
      createHref={createHref}
      getIssueHref={issueId => buildIssueDetailHref(issueId, issueNavigationContext)}
    />
  )
}

export const IssueListPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <IssueListContent
      searchParams={searchParams}
      onReplaceSearchParams={nextSearchParams => {
        const query = nextSearchParams.toString()
        router.replace(query ? `?${query}` : '?')
      }}
      createHref={buildIssueCreateHref(null)}
      issueNavigationContext={null}
    />
  )
}

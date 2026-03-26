'use client'

import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { LayoutSlot } from '@/components/layout/layout-slot'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfiniteIssueList } from '@/issue/hooks/use-issue-list'
import { useUpdateIssueMutation } from '@/issue/hooks/use-update-issue'
import { ProjectKanbanCard, ProjectKanbanCardView } from '@/project/components/project-kanban-card'
import { ProjectKanbanColumn } from '@/project/components/project-kanban-column'
import {
  buildKanbanColumns,
  createOptionLookup,
  findCardByIssueId,
  findStatusMeta,
  parseIssueDragId,
  parseStatusDropId,
  ProjectKanbanColumnData,
  ProjectKanbanOptimisticOverrides,
  resolveKanbanStatusConfig,
} from '@/project/components/project-kanban-utils'
import { useIssuePropertyMetas } from '@/property/hooks/use-issue-property-metas'
import { usePropertyOptions } from '@/property/hooks/use-property-options'
import { PropertyOptionItem } from '@/property/types/property-types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { FilterOperator, SystemPropertyId } from '@repo/shared/property/constants'
import { FilterCondition, Operation } from '@repo/shared/property/types'
import type { IssueNavigationContext } from '@/issue/utils/navigation-context'

const KANBAN_PAGE_SIZE = 50
const LOADING_COLUMN_COUNT = 4

const hasOwnField = <T extends object>(value: T, key: keyof T) => Object.prototype.hasOwnProperty.call(value, key)
const getRowStringValue = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null)

const ProjectKanbanLoading = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: LOADING_COLUMN_COUNT }, (_, index) => (
        <div key={index} className="bg-muted/35 w-[19rem] shrink-0 rounded-2xl border p-3">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ProjectKanbanViewProps {
  assigneeOptions: PropertyOptionItem[]
  columns: ProjectKanbanColumnData[]
  createHref: string
  errorMessage?: string | null
  isLoading?: boolean
  isLoadingMore?: boolean
  issueCount: number
  onMoveIssue: (issueId: number, toStatusId: string) => void
  onUpdateAssignee: (issueId: number, assigneeId: string | null) => void
  onUpdatePriority: (issueId: number, priorityId: string | null) => void
  priorityOptions: PropertyOptionItem[]
  updatingIssueIds?: number[]
}

export const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({
  assigneeOptions,
  columns,
  createHref,
  errorMessage = null,
  isLoading = false,
  isLoadingMore = false,
  issueCount,
  onMoveIssue,
  onUpdateAssignee,
  onUpdatePriority,
  priorityOptions,
  updatingIssueIds = [],
}) => {
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null)
  const updatingIssueIdSet = useMemo(() => new Set(updatingIssueIds), [updatingIssueIds])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const activeCard = useMemo(() => findCardByIssueId(columns, activeIssueId), [activeIssueId, columns])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveIssueId(parseIssueDragId(event.active.id))
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveIssueId(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const issueId = parseIssueDragId(event.active.id)
      const currentStatusId = event.active.data.current?.statusId
      const nextStatusId = parseStatusDropId(event.over?.id)
      setActiveIssueId(null)

      if (
        issueId === null ||
        typeof currentStatusId !== 'string' ||
        !nextStatusId ||
        currentStatusId === nextStatusId
      ) {
        return
      }

      onMoveIssue(issueId, nextStatusId)
    },
    [onMoveIssue],
  )

  return (
    <LayoutSlot data-testid="project-kanban-shell" className="flex min-h-0 w-full flex-1 flex-col px-2 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Kanban</h2>
          <p className="text-muted-foreground text-sm">
            {issueCount} issue{issueCount === 1 ? '' : 's'} across {columns.length} statuses
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={createHref}>
            <Plus className="size-4" />
            New Issue
          </Link>
        </Button>
      </div>

      {errorMessage ? (
        <div className="text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm">
          {errorMessage}
        </div>
      ) : isLoading ? (
        <ProjectKanbanLoading />
      ) : (
        <>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}>
            <div className="min-h-0 flex-1 overflow-x-auto pb-2">
              <div className="flex h-full min-h-[30rem] min-w-max gap-4">
                {columns.map(column => (
                  <ProjectKanbanColumn key={column.statusId} column={column}>
                    {column.cards.map(card => (
                      <ProjectKanbanCard
                        key={card.issueId}
                        assigneeOptions={assigneeOptions}
                        card={card}
                        isPending={updatingIssueIdSet.has(card.issueId)}
                        onUpdateAssignee={onUpdateAssignee}
                        onUpdatePriority={onUpdatePriority}
                        priorityOptions={priorityOptions}
                      />
                    ))}
                  </ProjectKanbanColumn>
                ))}
              </div>
            </div>

            <DragOverlay>{activeCard ? <ProjectKanbanCardView card={activeCard} isDragOverlay /> : null}</DragOverlay>
          </DndContext>

          {isLoadingMore ? <p className="text-muted-foreground mt-3 text-sm">Loading remaining issues...</p> : null}
        </>
      )}
    </LayoutSlot>
  )
}

interface ProjectKanbanProps {
  createHref: string
  issueNavigationContext?: IssueNavigationContext | null
  projectId: string
}

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({ createHref, issueNavigationContext, projectId }) => {
  const fields = useIssuePropertyMetas()
  const statusMeta = useMemo(() => findStatusMeta(fields), [fields])
  const statusConfig = useMemo(() => resolveKanbanStatusConfig(statusMeta), [statusMeta])
  const priorityOptionsQuery = usePropertyOptions(SystemPropertyId.PRIORITY)
  const assigneeOptionsQuery = usePropertyOptions(SystemPropertyId.ASSIGNEE)
  const { updateIssue } = useUpdateIssueMutation()
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<number, ProjectKanbanOptimisticOverrides>>({})
  const [updatingIssueIds, setUpdatingIssueIds] = useState<number[]>([])

  const filters = useMemo<FilterCondition[]>(
    () => [
      {
        propertyId: SystemPropertyId.PROJECT,
        propertyType: 'project',
        operator: FilterOperator.HasAnyOf,
        operand: [projectId],
      },
    ],
    [projectId],
  )

  const apiSearchParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('perPage', String(KANBAN_PAGE_SIZE))
    params.set('filters', JSON.stringify(filters))
    return params
  }, [filters])

  const issuesQuery = useInfiniteIssueList(apiSearchParams)
  const {
    data: issuePages,
    error: issueQueryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isIssuesLoading,
    isPending: isIssuesPending,
  } = issuesQuery

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const rows = useMemo(() => issuePages?.pages.flatMap(page => page.rows) ?? [], [issuePages])

  const issueStatusMap = useMemo(
    () => new Map<number, string | null>(rows.map(row => [row.id, getRowStringValue(row[SystemPropertyId.STATUS])])),
    [rows],
  )
  const issuePriorityMap = useMemo(
    () => new Map<number, string | null>(rows.map(row => [row.id, getRowStringValue(row[SystemPropertyId.PRIORITY])])),
    [rows],
  )
  const issueAssigneeMap = useMemo(
    () => new Map<number, string | null>(rows.map(row => [row.id, getRowStringValue(row[SystemPropertyId.ASSIGNEE])])),
    [rows],
  )

  useEffect(() => {
    if (Object.keys(optimisticOverrides).length === 0) {
      return
    }

    setOptimisticOverrides(previous => {
      let hasChanges = false
      const next: Record<number, ProjectKanbanOptimisticOverrides> = {}

      for (const [issueId, override] of Object.entries(previous)) {
        const resolvedIssueId = Number(issueId)

        if (!issueStatusMap.has(resolvedIssueId)) {
          hasChanges = true
          continue
        }

        const remainingOverride: ProjectKanbanOptimisticOverrides = {}

        if (hasOwnField(override, 'statusId')) {
          if (issueStatusMap.get(resolvedIssueId) !== override.statusId) {
            remainingOverride.statusId = override.statusId
          } else {
            hasChanges = true
          }
        }

        if (hasOwnField(override, 'priorityValue')) {
          if (issuePriorityMap.get(resolvedIssueId) !== override.priorityValue) {
            remainingOverride.priorityValue = override.priorityValue
          } else {
            hasChanges = true
          }
        }

        if (hasOwnField(override, 'assigneeValue')) {
          if (issueAssigneeMap.get(resolvedIssueId) !== override.assigneeValue) {
            remainingOverride.assigneeValue = override.assigneeValue
          } else {
            hasChanges = true
          }
        }

        if (Object.keys(remainingOverride).length > 0) {
          next[resolvedIssueId] = remainingOverride
        } else {
          hasChanges = true
        }
      }

      return hasChanges ? next : previous
    })
  }, [issueAssigneeMap, issuePriorityMap, issueStatusMap, optimisticOverrides])

  const priorityLookup = useMemo(() => createOptionLookup(priorityOptionsQuery.data), [priorityOptionsQuery.data])
  const assigneeLookup = useMemo(() => createOptionLookup(assigneeOptionsQuery.data), [assigneeOptionsQuery.data])
  const optimisticOverrideMap = useMemo(
    () =>
      new Map<number, ProjectKanbanOptimisticOverrides>(
        Object.entries(optimisticOverrides).map(([issueId, override]) => [Number(issueId), override]),
      ),
    [optimisticOverrides],
  )

  const columns = useMemo(() => {
    if (!statusConfig) {
      return []
    }

    return buildKanbanColumns({
      rows,
      config: statusConfig,
      issueNavigationContext,
      optimisticOverrides: optimisticOverrideMap,
      priorityOptions: priorityLookup,
      assigneeOptions: assigneeLookup,
    })
  }, [assigneeLookup, issueNavigationContext, optimisticOverrideMap, priorityLookup, rows, statusConfig])

  const patchOptimisticOverride = useCallback((issueId: number, patch: Partial<ProjectKanbanOptimisticOverrides>) => {
    setOptimisticOverrides(previous => ({
      ...previous,
      [issueId]: {
        ...previous[issueId],
        ...patch,
      },
    }))
  }, [])

  const clearOptimisticOverrideField = useCallback((issueId: number, field: keyof ProjectKanbanOptimisticOverrides) => {
    setOptimisticOverrides(previous => {
      const issueOverride = previous[issueId]
      if (!issueOverride || !hasOwnField(issueOverride, field)) {
        return previous
      }

      const nextIssueOverride = { ...issueOverride }
      delete nextIssueOverride[field]

      if (Object.keys(nextIssueOverride).length === 0) {
        const { [issueId]: _removedOverride, ...rest } = previous
        return rest
      }

      return {
        ...previous,
        [issueId]: nextIssueOverride,
      }
    })
  }, [])

  const handleMoveIssue = useCallback(
    async (issueId: number, toStatusId: string) => {
      const currentStatusId = optimisticOverrideMap.get(issueId)?.statusId ?? issueStatusMap.get(issueId)

      if (!currentStatusId || currentStatusId === toStatusId) {
        return
      }

      patchOptimisticOverride(issueId, { statusId: toStatusId })
      setUpdatingIssueIds(previous => (previous.includes(issueId) ? previous : [...previous, issueId]))

      const operations: Operation[] = [
        {
          propertyId: SystemPropertyId.STATUS,
          operationType: 'set',
          operationPayload: { value: toStatusId },
        },
      ]

      try {
        await updateIssue({ issueId, operations })
      } catch (error) {
        clearOptimisticOverrideField(issueId, 'statusId')
        toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setUpdatingIssueIds(previous => previous.filter(id => id !== issueId))
      }
    },
    [clearOptimisticOverrideField, issueStatusMap, optimisticOverrideMap, patchOptimisticOverride, updateIssue],
  )

  const handleUpdateField = useCallback(
    async (
      issueId: number,
      propertyId: SystemPropertyId.PRIORITY | SystemPropertyId.ASSIGNEE,
      value: string | null,
    ) => {
      const optimisticField = propertyId === SystemPropertyId.PRIORITY ? 'priorityValue' : 'assigneeValue'

      patchOptimisticOverride(issueId, { [optimisticField]: value })
      setUpdatingIssueIds(previous => (previous.includes(issueId) ? previous : [...previous, issueId]))

      const operations: Operation[] =
        value === null
          ? [
              {
                propertyId,
                operationType: 'clear',
                operationPayload: {},
              },
            ]
          : [
              {
                propertyId,
                operationType: 'set',
                operationPayload: { value },
              },
            ]

      try {
        await updateIssue({ issueId, operations })
      } catch (error) {
        clearOptimisticOverrideField(issueId, optimisticField)
        toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setUpdatingIssueIds(previous => previous.filter(id => id !== issueId))
      }
    },
    [clearOptimisticOverrideField, patchOptimisticOverride, updateIssue],
  )

  const isPropertiesLoaded = fields.length > 0
  const errorMessage =
    issueQueryError instanceof Error
      ? issueQueryError.message
      : isPropertiesLoaded && !statusMeta
        ? 'Status property is not available for this workspace.'
        : isPropertiesLoaded && statusMeta && !statusConfig
          ? 'Status configuration is invalid. Update the status property configuration to render the board.'
          : null

  return (
    <ProjectKanbanView
      assigneeOptions={assigneeOptionsQuery.data ?? []}
      columns={columns}
      createHref={createHref}
      errorMessage={errorMessage}
      isLoading={!errorMessage && (!isPropertiesLoaded || isIssuesLoading || isIssuesPending)}
      isLoadingMore={Boolean(hasNextPage) || isFetchingNextPage}
      issueCount={rows.length}
      onMoveIssue={handleMoveIssue}
      onUpdateAssignee={(issueId, assigneeId) => handleUpdateField(issueId, SystemPropertyId.ASSIGNEE, assigneeId)}
      onUpdatePriority={(issueId, priorityId) => handleUpdateField(issueId, SystemPropertyId.PRIORITY, priorityId)}
      priorityOptions={priorityOptionsQuery.data ?? []}
      updatingIssueIds={updatingIssueIds}
    />
  )
}

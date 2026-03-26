import { IssueRowType } from '@/issue/types/issue-types'
import { buildIssueDetailHref, IssueNavigationContext } from '@/issue/utils/navigation-context'
import { getStatusConfig } from '@/property/components/fields/status/status-utils'
import { PropertyMeta, PropertyOptionItem } from '@/property/types/property-types'
import { SystemPropertyId } from '@repo/shared'
import type { UniqueIdentifier } from '@dnd-kit/core'
import type { StatusDefinition, StatusPropertyConfig } from '@repo/shared/property/types'
import type { ReactNode } from 'react'

const ISSUE_DRAG_ID_PREFIX = 'issue:'
const STATUS_DROP_ID_PREFIX = 'status:'

export interface ProjectKanbanOptionDisplay {
  label: string
  icon: ReactNode | null
}

export interface ProjectKanbanOptimisticOverrides {
  assigneeValue?: string | null
  priorityValue?: string | null
  statusId?: string
}

export interface ProjectKanbanCardData {
  assigneeValue: string | null
  issueId: number
  title: string
  href: string
  priority: ProjectKanbanOptionDisplay | null
  priorityValue: string | null
  statusId: string
  assignee: ProjectKanbanOptionDisplay | null
}

export interface ProjectKanbanColumnData {
  statusId: string
  label: string
  iconName: string
  cards: ProjectKanbanCardData[]
}

const getStringValue = (value: unknown): string | null => {
  return typeof value === 'string' && value.length > 0 ? value : null
}

const hasOwn = <T extends object>(value: T, key: keyof T) => Object.prototype.hasOwnProperty.call(value, key)

export const createOptionLookup = (options: PropertyOptionItem[] | undefined) => {
  return new Map<string, ProjectKanbanOptionDisplay>(
    (options ?? []).map(option => [
      String(option.value),
      {
        label: option.label,
        icon: option.icon ?? null,
      },
    ]),
  )
}

export const resolveOptionDisplay = (
  value: unknown,
  options: Map<string, ProjectKanbanOptionDisplay>,
): ProjectKanbanOptionDisplay | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    options.get(String(value)) ?? {
      label: String(value),
      icon: null,
    }
  )
}

export const resolveKanbanStatusConfig = (
  statusMeta: Pick<PropertyMeta, 'config'> | null | undefined,
): StatusPropertyConfig | null => {
  if (!statusMeta) {
    return null
  }

  return getStatusConfig(statusMeta)
}

const resolveIssueStatusId = (row: IssueRowType, config: StatusPropertyConfig): string => {
  const rawStatusId = getStringValue(row[SystemPropertyId.STATUS])
  const configuredStatusIds = new Set(config.statuses.map(status => status.id))

  if (rawStatusId && configuredStatusIds.has(rawStatusId)) {
    return rawStatusId
  }

  if (configuredStatusIds.has(config.initialStatusId)) {
    return config.initialStatusId
  }

  return config.statuses[0]?.id ?? ''
}

export const buildKanbanColumns = ({
  rows,
  config,
  issueNavigationContext,
  optimisticOverrides,
  priorityOptions,
  assigneeOptions,
}: {
  rows: IssueRowType[]
  config: StatusPropertyConfig
  issueNavigationContext: IssueNavigationContext | null | undefined
  optimisticOverrides: Map<number, ProjectKanbanOptimisticOverrides>
  priorityOptions: Map<string, ProjectKanbanOptionDisplay>
  assigneeOptions: Map<string, ProjectKanbanOptionDisplay>
}): ProjectKanbanColumnData[] => {
  const columnMap = new Map<string, ProjectKanbanColumnData>(
    config.statuses.map(status => [
      status.id,
      {
        statusId: status.id,
        label: status.label,
        iconName: status.icon,
        cards: [],
      },
    ]),
  )

  for (const row of rows) {
    const override = optimisticOverrides.get(row.id)
    const fallbackStatusId = resolveIssueStatusId(row, config)
    const statusId = override?.statusId ?? fallbackStatusId
    const column = columnMap.get(statusId) ?? columnMap.get(fallbackStatusId)

    if (!column) {
      continue
    }

    const title = getStringValue(row[SystemPropertyId.TITLE]) ?? `Issue ${row.id}`
    const priorityValue =
      override && hasOwn(override, 'priorityValue')
        ? (override.priorityValue ?? null)
        : getStringValue(row[SystemPropertyId.PRIORITY])
    const assigneeValue =
      override && hasOwn(override, 'assigneeValue')
        ? (override.assigneeValue ?? null)
        : getStringValue(row[SystemPropertyId.ASSIGNEE])

    column.cards.push({
      assigneeValue,
      issueId: row.id,
      title,
      href: buildIssueDetailHref(row.id, issueNavigationContext),
      priority: resolveOptionDisplay(priorityValue, priorityOptions),
      priorityValue,
      statusId: column.statusId,
      assignee: resolveOptionDisplay(assigneeValue, assigneeOptions),
    })
  }

  return config.statuses.map(status => columnMap.get(status.id)!).filter(Boolean)
}

export const findStatusMeta = (metas: PropertyMeta[]): PropertyMeta | null => {
  return metas.find(meta => meta.core.propertyId === SystemPropertyId.STATUS) ?? null
}

export const getIssueDragId = (issueId: number) => `${ISSUE_DRAG_ID_PREFIX}${issueId}`

export const getStatusDropId = (statusId: string) => `${STATUS_DROP_ID_PREFIX}${statusId}`

export const parseIssueDragId = (id: UniqueIdentifier | null | undefined): number | null => {
  if (typeof id !== 'string' || !id.startsWith(ISSUE_DRAG_ID_PREFIX)) {
    return null
  }

  const issueId = Number(id.slice(ISSUE_DRAG_ID_PREFIX.length))
  return Number.isFinite(issueId) ? issueId : null
}

export const parseStatusDropId = (id: UniqueIdentifier | null | undefined): string | null => {
  if (typeof id !== 'string' || !id.startsWith(STATUS_DROP_ID_PREFIX)) {
    return null
  }

  return id.slice(STATUS_DROP_ID_PREFIX.length) || null
}

export const findCardByIssueId = (columns: ProjectKanbanColumnData[], issueId: number | null) => {
  if (issueId === null) {
    return null
  }

  for (const column of columns) {
    const card = column.cards.find(candidate => candidate.issueId === issueId)
    if (card) {
      return card
    }
  }

  return null
}

export const findStatusDefinitionById = (
  statuses: StatusDefinition[],
  statusId: string | null | undefined,
): StatusDefinition | null => {
  if (!statusId) {
    return null
  }

  return statuses.find(status => status.id === statusId) ?? null
}

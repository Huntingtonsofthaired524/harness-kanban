import { http } from 'msw/core/http'

import { PropertyType, SystemPropertyId } from '@repo/shared/property/constants'
import type { PropertyDefinition } from '@repo/shared/property/types'

const defaultStatusConfig = {
  initialStatusId: 'todo',
  statuses: [
    { id: 'todo', label: 'Todo', icon: 'Circle' },
    { id: 'queued', label: 'Queued', icon: 'Clock3' },
    { id: 'planning', label: 'Planning', icon: 'FileText' },
    { id: 'needs_clarification', label: 'Needs clarification', icon: 'CircleHelp' },
    { id: 'plan_in_review', label: 'Plan in review', icon: 'ClipboardCheck' },
    { id: 'in_progress', label: 'In progress', icon: 'Hammer' },
    { id: 'needs_help', label: 'Needs help', icon: 'LifeBuoy' },
    { id: 'in_review', label: 'In review', icon: 'GitPullRequest' },
    { id: 'completed', label: 'Completed', icon: 'BadgeCheck' },
    { id: 'canceled', label: 'Canceled', icon: 'CircleSlash' },
  ],
  transitions: {
    todo: [
      { toStatusId: 'queued', actionLabel: 'Queue' },
      { toStatusId: 'in_progress', actionLabel: 'Start work' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    queued: [
      { toStatusId: 'planning', actionLabel: 'Start planning' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    planning: [
      { toStatusId: 'plan_in_review', actionLabel: 'Submit plan' },
      { toStatusId: 'needs_clarification', actionLabel: 'Request clarification' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    needs_clarification: [
      { toStatusId: 'planning', actionLabel: 'Resume planning' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    plan_in_review: [
      { toStatusId: 'in_progress', actionLabel: 'Approve plan' },
      { toStatusId: 'planning', actionLabel: 'Request changes' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    in_progress: [
      { toStatusId: 'needs_help', actionLabel: 'Request help' },
      { toStatusId: 'in_review', actionLabel: 'Submit for review' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    needs_help: [
      { toStatusId: 'in_progress', actionLabel: 'Resume work' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    in_review: [
      { toStatusId: 'in_progress', actionLabel: 'Request changes' },
      { toStatusId: 'completed', actionLabel: 'Approve' },
      { toStatusId: 'canceled', actionLabel: 'Cancel' },
    ],
    completed: [],
    canceled: [],
  },
}

export const defaultProperties: PropertyDefinition[] = [
  {
    id: SystemPropertyId.ID,
    name: 'ID',
    description: 'The unique identifier of the issue',
    type: PropertyType.ID,
    readonly: true,
    deletable: false,
  },
  {
    id: SystemPropertyId.TITLE,
    name: 'Title',
    description: 'The title of the issue',
    type: PropertyType.TITLE,
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.STATUS,
    name: 'Status',
    description: 'Status of the issue',
    type: PropertyType.STATUS,
    config: defaultStatusConfig,
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.PRIORITY,
    name: 'Priority',
    description: 'Priority of the issue',
    type: PropertyType.SELECT,
    config: {
      options: [
        { id: 'no-priority', name: 'No Priority' },
        { id: 'low', name: 'Low', icon: 'SignalLow' },
        { id: 'medium', name: 'Medium', icon: 'SignalMedium' },
        { id: 'high', name: 'High', icon: 'SignalHigh' },
        { id: 'urgent', name: 'Urgent', icon: 'AlertTriangle' },
      ],
    },
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.PROJECT,
    name: 'Project',
    description: 'Project associated with the issue',
    type: PropertyType.PROJECT,
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.ASSIGNEE,
    name: 'Assignee',
    description: 'Assignee',
    type: PropertyType.USER,
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.REPORTER,
    name: 'Reporter',
    description: 'Reporter',
    type: PropertyType.USER,
    readonly: false,
    deletable: false,
  },
  {
    id: SystemPropertyId.CREATED_AT,
    name: 'Created At',
    type: PropertyType.DATETIME,
    readonly: true,
    deletable: false,
  },
  {
    id: SystemPropertyId.UPDATED_AT,
    name: 'Updated At',
    type: PropertyType.DATETIME,
    readonly: true,
    deletable: false,
  },
  {
    id: SystemPropertyId.DESCRIPTION,
    name: 'Description',
    description: 'The description of the issue',
    type: PropertyType.RICH_TEXT,
    readonly: false,
    deletable: false,
  },
]

export const createPropertiesHandler = (
  properties: PropertyDefinition[] = defaultProperties,
): ReturnType<typeof http.get> =>
  http.get('*/api/v1/properties', () =>
    Response.json({
      success: true,
      data: {
        properties,
      },
      error: null,
    }),
  )

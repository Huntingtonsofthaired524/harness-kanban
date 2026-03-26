import { useState } from 'react'

import { IssueFilterDropdown } from '@/issue/components/issue-filter-dropdown'
import { PropertyFilterInputType, PropertyMeta, PropertyTableColumnLayout } from '@/property/types/property-types'
import { FilterOperator, SystemPropertyId } from '@repo/shared/property/constants'
import { createMockIssues, createStatusActionsHandler, defaultProperties } from '../../../../../.storybook/msw'
import { EditableStatus, EditableStatusView } from './editable-status'
import { ReadonlyStatus } from './readonly-status'
import { getStatusDefinition } from './status-utils'
import { StatusTableCell } from './table-cell'
import type { FilterCondition } from '@repo/shared/property/types'
import type { Meta, StoryObj } from '@storybook/nextjs'

const statusProperty = defaultProperties.find(property => property.id === SystemPropertyId.STATUS)

if (!statusProperty?.config) {
  throw new Error('Expected Storybook status property config to be defined.')
}

const statusMeta: PropertyMeta = {
  core: {
    propertyId: SystemPropertyId.STATUS,
    type: 'status',
    required: true,
    defaultValue: 'todo',
  },
  config: statusProperty.config as Record<string, unknown>,
  display: {
    label: 'Status',
    placeholder: 'Status',
  },
  query: {
    sortable: true,
    filter: {
      input: PropertyFilterInputType.MultiSelect,
      operators: [FilterOperator.HasAnyOf],
    },
  },
  table: {
    layout: PropertyTableColumnLayout.LEFT,
    order: 1,
    defaultVisible: true,
  },
}

const statusMockIssues = createMockIssues(3).map((issue, index) => ({
  ...issue,
  issueId: index + 1,
  propertyValues: issue.propertyValues.map(propertyValue =>
    propertyValue.propertyId === SystemPropertyId.STATUS
      ? { ...propertyValue, value: index === 0 ? 'planning' : index === 1 ? 'in_progress' : 'completed' }
      : propertyValue,
  ),
}))

const ExistingIssueEditableStory = () => {
  const [value, setValue] = useState<string>('planning')

  return <EditableStatus value={value} meta={statusMeta} row={{ id: 1 }} onChange={next => setValue(next as string)} />
}

const CreateIssueEditableStory = () => {
  const [value, setValue] = useState<string>('planning')

  return <EditableStatus value={value} meta={statusMeta} onChange={next => setValue(next as string)} />
}

const StatusEditableViewStory = () => {
  const [currentStatusId, setCurrentStatusId] = useState('planning')
  const [open, setOpen] = useState(false)
  const currentStatus = getStatusDefinition(statusMeta, currentStatusId)
  const options = [
    {
      icon: 'ClipboardCheck',
      key: 'plan_in_review-Submit plan',
      primaryLabel: 'Submit plan',
      statusId: 'plan_in_review',
      secondaryLabel: 'Plan in review',
      value: 'plan_in_review',
    },
    {
      icon: 'CircleHelp',
      key: 'needs_clarification-Request clarification',
      primaryLabel: 'Request clarification',
      statusId: 'needs_clarification',
      secondaryLabel: 'Needs clarification',
      value: 'needs_clarification',
    },
  ]

  return (
    <EditableStatusView
      currentStatus={currentStatus}
      emptyMessage="No available actions"
      onOpenChange={setOpen}
      onSelectOption={option => {
        setCurrentStatusId(option.value)
        setOpen(false)
      }}
      options={options}
      open={open}
    />
  )
}

const StatusFilterStory = () => {
  const [filters, setFilters] = useState<FilterCondition[]>([
    {
      propertyId: SystemPropertyId.STATUS,
      propertyType: 'status',
      operator: FilterOperator.HasAnyOf,
      operand: ['in_progress'],
    },
  ])

  return (
    <div className="space-y-3">
      <IssueFilterDropdown columns={[statusMeta]} value={filters} onChange={setFilters} />
      <pre className="text-xs">{JSON.stringify(filters)}</pre>
    </div>
  )
}

const meta: Meta<typeof ReadonlyStatus> = {
  title: 'Property/Fields/Status',
  component: ReadonlyStatus,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: {
        issues: [createStatusActionsHandler(statusMockIssues)],
      },
    },
  },
  decorators: [
    Story => (
      <div className="min-w-[280px] space-y-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof meta>

const waitForCondition = async (predicate: () => boolean, timeoutMs = 1500, intervalMs = 50) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (predicate()) {
      return
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Timed out waiting for condition.')
}

const findOpenSelectItem = (document: Document, text: string) => {
  return Array.from(document.body.querySelectorAll('[role="option"], [data-slot="select-item"]')).find(element =>
    element.textContent?.includes(text),
  )
}

export const TableCell: Story = {
  render: () => <StatusTableCell value="in_progress" row={{}} meta={statusMeta} />,
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('In progress') ?? false)
  },
}

export const IssueDetailProperty: Story = {
  render: () => <ReadonlyStatus value="plan_in_review" meta={statusMeta} />,
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Plan in review') ?? false)
  },
}

export const EditableView: Story = {
  render: () => <StatusEditableViewStory />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Array.from(canvasElement.querySelectorAll('button')).some(button => button.textContent?.includes('Planning')),
    )

    const trigger = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Planning'),
    )

    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Expected editable status view trigger to render.')
    }

    await userEvent.click(trigger)

    await waitForCondition(() => canvasElement.ownerDocument.body.textContent?.includes('Submit plan') ?? false)

    const submitPlanAction = findOpenSelectItem(canvasElement.ownerDocument, 'Submit plan')

    if (!(submitPlanAction instanceof HTMLElement)) {
      throw new Error('Expected a presentational transition action to render.')
    }

    await userEvent.click(submitPlanAction)

    await waitForCondition(() => canvasElement.textContent?.includes('Plan in review') ?? false)
  },
}

export const EditableField: Story = {
  name: 'Editable Field (Existing Issue)',
  render: () => <ExistingIssueEditableStory />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Array.from(canvasElement.querySelectorAll('button')).some(button => button.textContent?.includes('Planning')),
    )

    const trigger = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Planning'),
    )

    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Expected editable status trigger to render.')
    }

    await userEvent.click(trigger)

    await waitForCondition(() => canvasElement.ownerDocument.body.textContent?.includes('Submit plan') ?? false)

    const submitPlanAction = findOpenSelectItem(canvasElement.ownerDocument, 'Submit plan')

    if (!(submitPlanAction instanceof HTMLElement)) {
      throw new Error('Expected a transition action for the planning status.')
    }

    await userEvent.click(submitPlanAction)

    await waitForCondition(() => canvasElement.textContent?.includes('Plan in review') ?? false)
  },
}

export const CreateEditableField: Story = {
  render: () => <CreateIssueEditableStory />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Array.from(canvasElement.querySelectorAll('button')).some(button => button.textContent?.includes('Planning')),
    )

    const trigger = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Planning'),
    )

    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error('Expected create-form status trigger to render.')
    }

    await userEvent.click(trigger)

    await waitForCondition(() => canvasElement.ownerDocument.body.textContent?.includes('Completed') ?? false)

    const completedOption = findOpenSelectItem(canvasElement.ownerDocument, 'Completed')

    if (!(completedOption instanceof HTMLElement)) {
      throw new Error('Expected full status options to render for the create form.')
    }

    if (canvasElement.ownerDocument.body.textContent?.includes('Submit plan')) {
      throw new Error('Create-form status dropdown should not render transition action labels.')
    }

    await userEvent.click(completedOption)

    await waitForCondition(() => canvasElement.textContent?.includes('Completed') ?? false)
  },
}

export const Filter: Story = {
  render: () => <StatusFilterStory />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Array.from(canvasElement.querySelectorAll('button')).some(button => button.textContent?.includes('Filter')),
    )

    const filterButton = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Filter'),
    )

    if (!(filterButton instanceof HTMLButtonElement)) {
      throw new Error('Expected filter button to render.')
    }

    await userEvent.click(filterButton)

    await waitForCondition(() =>
      Array.from(canvasElement.ownerDocument.body.querySelectorAll('[role="menuitem"]')).some(element =>
        element.textContent?.includes('Status'),
      ),
    )

    const statusTrigger = Array.from(canvasElement.ownerDocument.body.querySelectorAll('[role="menuitem"]')).find(
      element => element.textContent?.includes('Status'),
    )

    if (!(statusTrigger instanceof HTMLElement)) {
      throw new Error('Expected status filter submenu trigger to render.')
    }

    await userEvent.click(statusTrigger)

    await waitForCondition(() => canvasElement.ownerDocument.body.textContent?.includes('In progress') ?? false)
  },
}

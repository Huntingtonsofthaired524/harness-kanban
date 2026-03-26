import { FolderIcon } from 'lucide-react'
import { useState } from 'react'

import { IssueFilterDropdown } from '@/issue/components/issue-filter-dropdown'
import { FilterOperator, SystemPropertyId } from '@repo/shared/property/constants'
import { createProjectsHandler } from '../../../.storybook/msw/apis/projects'
import { PropertyFilterInputType, PropertyMeta, PropertyTableColumnLayout } from '../types/property-types'
import { EditableSelector } from './fields/selector/editable-selector'
import { ReadonlySelector } from './fields/selector/readonly-selector'
import { CapsuleSelectorTableCell } from './fields/selector/table-cell'
import type { FilterCondition } from '@repo/shared/property/types'
import type { Meta, StoryObj } from '@storybook/nextjs'

const projectMeta: PropertyMeta = {
  core: {
    propertyId: SystemPropertyId.PROJECT,
    type: 'project',
    required: false,
  },
  display: {
    label: 'Project',
    placeholder: 'Project',
    placeholderIcon: <FolderIcon className="text-muted-foreground size-4" />,
  },
  group: {
    id: 'project',
    label: 'Project',
  },
  query: {
    sortable: true,
    filter: {
      input: PropertyFilterInputType.MultiSelect,
      operators: [FilterOperator.HasAnyOf],
    },
  },
  table: {
    layout: PropertyTableColumnLayout.RIGHT,
    order: 99,
    defaultVisible: true,
  },
}

const ProjectPropertyFilterStory = () => {
  const [filters, setFilters] = useState<FilterCondition[]>([
    {
      propertyId: SystemPropertyId.PROJECT,
      propertyType: 'project',
      operator: FilterOperator.HasAnyOf,
      operand: ['project-1'],
    },
  ])

  return (
    <div className="space-y-3">
      <IssueFilterDropdown columns={[projectMeta]} value={filters} onChange={setFilters} />
      <pre className="text-xs">{JSON.stringify(filters)}</pre>
    </div>
  )
}

const meta: Meta<any> = {
  component: ReadonlySelector,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: {
        projects: [createProjectsHandler()],
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

type Story = StoryObj<any>

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

export const TableCell: Story = {
  render: () => <CapsuleSelectorTableCell value="project-1" row={{}} meta={projectMeta} />,
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Project Alpha') ?? false)
  },
}

export const IssueDetailProperty: Story = {
  render: () => <ReadonlySelector value="project-2" meta={projectMeta} />,
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Project Beta') ?? false)
  },
}

export const EditableField: Story = {
  render: () => <EditableSelector value="project-1" meta={projectMeta} onChange={() => {}} />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() => canvasElement.querySelector('[role="combobox"]') instanceof HTMLElement)

    const trigger = canvasElement.querySelector('[role="combobox"]')

    if (!(trigger instanceof HTMLElement)) {
      throw new Error('Expected editable project selector trigger to render.')
    }

    await userEvent.click(trigger)

    if (!canvasElement.ownerDocument.body.textContent?.includes('Project Beta')) {
      throw new Error('Expected project options to render in editable selector.')
    }
  },
}

export const Filter: Story = {
  render: () => <ProjectPropertyFilterStory />,
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Array.from(canvasElement.querySelectorAll('button')).some(button => button.textContent?.includes('Filter')),
    )

    const filterButton = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Filter'),
    ) as HTMLButtonElement | undefined

    if (!filterButton) {
      throw new Error('Expected filter button to render.')
    }

    await userEvent.click(filterButton)

    await waitForCondition(() => canvasElement.ownerDocument.body.textContent?.includes('Project') ?? false)

    if (!canvasElement.ownerDocument.body.textContent?.includes('Project')) {
      throw new Error('Expected project filter submenu trigger to render.')
    }
  },
}

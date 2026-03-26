import { ProjectKanbanView } from './project-kanban'
import {
  denseKanbanColumns,
  sampleAssigneeOptions,
  sampleKanbanColumns,
  samplePriorityOptions,
} from './project-kanban-story-data'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof ProjectKanbanView> = {
  component: ProjectKanbanView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    assigneeOptions: sampleAssigneeOptions,
    columns: sampleKanbanColumns,
    issueCount: sampleKanbanColumns.reduce((total, column) => total + column.cards.length, 0),
    createHref: '/issues/new?issueSource=project&issueProjectId=project-1',
    onMoveIssue: () => {},
    onUpdateAssignee: () => {},
    onUpdatePriority: () => {},
    priorityOptions: samplePriorityOptions,
  },
  render: args => (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <ProjectKanbanView {...args} />
    </div>
  ),
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

export const DefaultBoard: Story = {
  play: async ({ canvasElement }) => {
    await waitForCondition(() => Boolean(canvasElement.querySelector('[data-testid="project-kanban-shell"]')))

    const kanbanShell = canvasElement.querySelector('[data-testid="project-kanban-shell"]')
    if (!kanbanShell) {
      throw new Error('Expected the Kanban shell to render.')
    }

    if (kanbanShell.className.includes('max-w-6xl') || kanbanShell.className.includes('container')) {
      throw new Error('Expected the Kanban shell to use the available page width.')
    }

    if (!canvasElement.textContent?.includes('Kanban')) {
      throw new Error('Expected the Kanban header to render.')
    }

    if (!canvasElement.textContent?.includes('Todo') || !canvasElement.textContent?.includes('In progress')) {
      throw new Error('Expected configured status columns to render.')
    }

    if (!canvasElement.textContent?.includes('New Issue')) {
      throw new Error('Expected the create issue action to render.')
    }
  },
}

export const WithEmptyColumn: Story = {
  args: {
    columns: sampleKanbanColumns,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Completed') ?? false)

    if (!canvasElement.textContent?.includes('Completed') || !canvasElement.textContent?.includes('No issues')) {
      throw new Error('Expected empty status columns to stay visible on the board.')
    }
  },
}

export const DenseColumn: Story = {
  args: {
    columns: denseKanbanColumns,
    issueCount: denseKanbanColumns.reduce((total, column) => total + column.cards.length, 0),
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Dense column issue 9') ?? false)

    if (!canvasElement.textContent?.includes('Dense column issue 9')) {
      throw new Error('Expected dense Kanban columns to render all sample cards.')
    }
  },
}

export const Loading: Story = {
  args: {
    columns: [],
    issueCount: 0,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Kanban') ?? false)

    if (!canvasElement.textContent?.includes('Kanban')) {
      throw new Error('Expected the Kanban header to remain visible while loading.')
    }
  },
}

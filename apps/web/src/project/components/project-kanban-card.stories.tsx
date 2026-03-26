import { ProjectKanbanCardView } from './project-kanban-card'
import { sampleAssigneeOptions, sampleKanbanCard, samplePriorityOptions } from './project-kanban-story-data'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof ProjectKanbanCardView> = {
  component: ProjectKanbanCardView,
  args: {
    assigneeOptions: sampleAssigneeOptions,
    card: sampleKanbanCard,
    onOpenIssue: () => {},
    onUpdateAssignee: () => {},
    onUpdatePriority: () => {},
    priorityOptions: samplePriorityOptions,
  },
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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Issue 101') ?? false)

    if (!canvasElement.textContent?.includes('Issue 101')) {
      throw new Error('Expected issue id text to render in the Kanban card.')
    }

    if (!canvasElement.textContent?.includes('Build a proper project board for issue flow management')) {
      throw new Error('Expected issue title to render in the Kanban card.')
    }

    if (!canvasElement.textContent?.includes('High') || !canvasElement.textContent?.includes('Alice')) {
      throw new Error('Expected priority and assignee metadata to render in the Kanban card.')
    }

    if (canvasElement.querySelectorAll('[data-slot="select-trigger"]').length < 2) {
      throw new Error('Expected inline selectors to render for priority and assignee.')
    }
  },
}

export const Unassigned: Story = {
  args: {
    card: {
      ...sampleKanbanCard,
      assigneeValue: null,
      issueId: 105,
      priorityValue: null,
      title: 'Render fallback metadata when optional values are empty',
      assignee: null,
      priority: null,
    },
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Unassigned') ?? false)

    if (!canvasElement.textContent?.includes('Unassigned') || !canvasElement.textContent?.includes('No priority')) {
      throw new Error('Expected fallback assignee and priority labels to render.')
    }
  },
}

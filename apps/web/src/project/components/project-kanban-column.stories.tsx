import { ProjectKanbanCardView } from './project-kanban-card'
import { ProjectKanbanColumnView } from './project-kanban-column'
import { sampleAssigneeOptions, sampleKanbanColumns, samplePriorityOptions } from './project-kanban-story-data'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof ProjectKanbanColumnView> = {
  component: ProjectKanbanColumnView,
  parameters: {
    layout: 'padded',
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

export const Populated: Story = {
  args: {
    column: sampleKanbanColumns[0],
  },
  render: args => (
    <div className="h-[32rem] max-w-[19rem]">
      <ProjectKanbanColumnView {...args}>
        {args.column.cards.map(card => (
          <ProjectKanbanCardView
            key={card.issueId}
            assigneeOptions={sampleAssigneeOptions}
            card={card}
            onOpenIssue={() => {}}
            onUpdateAssignee={() => {}}
            onUpdatePriority={() => {}}
            priorityOptions={samplePriorityOptions}
          />
        ))}
      </ProjectKanbanColumnView>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Todo') ?? false)

    if (!canvasElement.textContent?.includes('Todo')) {
      throw new Error('Expected the status label to render in the column header.')
    }

    if (!canvasElement.textContent?.includes('Build a proper project board for issue flow management')) {
      throw new Error('Expected cards to render inside the column.')
    }
  },
}

export const Empty: Story = {
  args: {
    column: sampleKanbanColumns[3],
  },
  render: args => (
    <div className="h-[32rem] max-w-[19rem]">
      <ProjectKanbanColumnView {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Completed') ?? false)

    if (!canvasElement.textContent?.includes('Completed') || !canvasElement.textContent?.includes('No issues')) {
      throw new Error('Expected empty-state messaging to render for an empty status column.')
    }
  },
}

import { ProjectCard, ProjectCreateCard } from './project-card'
import type { ProjectSummary } from '@repo/shared/project/types'
import type { Meta, StoryObj } from '@storybook/nextjs'

const project: ProjectSummary = {
  id: 'project-1',
  name: 'Project Alpha',
  githubRepoUrl: 'https://github.com/harness-kanban/project-alpha',
  repoBaseBranch: 'main',
  checkCiCd: true,
  previewCommands: ['pnpm install', 'pnpm dev'],
  createdAt: '2026-03-11T00:00:00Z',
  updatedAt: '2026-03-11T00:00:00Z',
}

const meta: Meta<any> = {
  component: ProjectCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <div className="max-w-sm">
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

export const Default: Story = {
  args: {
    project,
    href: '/projects/project-1',
  },
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Project Alpha') ?? false)

    if (!canvasElement.textContent?.includes('Project Alpha')) {
      throw new Error('Expected project card title to render.')
    }

    if (!canvasElement.textContent?.includes('harness-kanban/project-alpha')) {
      throw new Error('Expected project repository label to render.')
    }

    if (!canvasElement.textContent?.includes('main')) {
      throw new Error('Expected project branch to render.')
    }
  },
}

export const CreateCard: Story = {
  render: () => <ProjectCreateCard onClick={() => {}} />,
  play: async ({ canvasElement }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Create project') ?? false)

    if (!canvasElement.textContent?.includes('Create project')) {
      throw new Error('Expected create card label to render.')
    }
  },
}

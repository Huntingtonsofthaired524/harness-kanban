import { StoryLayout } from '../../../.storybook/components'
import { createMockProjects, createProjectsHandler } from '../../../.storybook/msw/apis/projects'
import { ProjectListPage } from './list-page'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof ProjectListPage> = {
  component: ProjectListPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <StoryLayout>
        <Story />
      </StoryLayout>
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

export const Default: Story = {
  parameters: {
    msw: {
      handlers: {
        projects: [createProjectsHandler({ projects: createMockProjects() })],
      },
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() => canvasElement.textContent?.includes('Project Alpha') ?? false)
    await waitForCondition(() => canvasElement.textContent?.includes('Project Beta') ?? false)

    const createButton = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.toLowerCase().includes('create project'),
    ) as HTMLButtonElement | undefined

    if (!createButton) {
      throw new Error('Expected create project button to render.')
    }

    await userEvent.click(createButton)

    if (
      !canvasElement.ownerDocument.body.textContent?.includes(
        'Add a repository-backed project and make it available to issues.',
      )
    ) {
      throw new Error('Expected create dialog content to render.')
    }
  },
}

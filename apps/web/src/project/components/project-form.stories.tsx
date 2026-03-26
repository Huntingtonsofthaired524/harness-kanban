import { ProjectForm } from './project-form'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  component: ProjectForm,
} satisfies Meta<any>

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

export const CreateMode: Story = {
  render: () => (
    <ProjectForm mode="create" submitLabel="Create project" onCancel={() => {}} onSubmit={async () => {}} />
  ),
  play: async ({ canvasElement, userEvent }) => {
    await waitForCondition(() =>
      Boolean(
        canvasElement.querySelector('#create-project-name') &&
          canvasElement.querySelector('#create-project-repo') &&
          canvasElement.querySelector('#create-project-branch') &&
          canvasElement.querySelector('#create-project-mcp-config'),
      ),
    )

    const nameField = canvasElement.querySelector('#create-project-name') as HTMLInputElement | null
    const repoField = canvasElement.querySelector('#create-project-repo') as HTMLInputElement | null
    const branchField = canvasElement.querySelector('#create-project-branch') as HTMLInputElement | null
    const mcpConfigField = canvasElement.querySelector('#create-project-mcp-config') as HTMLTextAreaElement | null

    if (!nameField || !repoField || !branchField || !mcpConfigField) {
      throw new Error('Expected project form inputs to render.')
    }

    await userEvent.type(nameField, 'Project Gamma')
    await userEvent.type(repoField, 'https://github.com/harness-kanban/project-gamma')
    await userEvent.type(branchField, 'main')

    if (!canvasElement.textContent?.includes('Create project')) {
      throw new Error('Expected submit button to render.')
    }

    if (canvasElement.textContent?.includes('Preview commands')) {
      throw new Error('Expected preview commands section to be removed from create mode.')
    }

    if (!mcpConfigField.placeholder.includes('"docs"')) {
      throw new Error('Expected MCP config example placeholder to render.')
    }

    if (
      !canvasElement.textContent?.includes(
        'Store project-level MCP servers for Codex. This config is loaded only when a new workspace is created, and existing workspaces stay unchanged.',
      )
    ) {
      throw new Error('Expected MCP config helper text to render.')
    }
  },
}

export const UpdateMode: Story = {
  render: () => (
    <ProjectForm
      mode="update"
      submitLabel="Save changes"
      onSubmit={async () => {}}
      initialProject={{
        id: 'project-1',
        name: 'Project Alpha',
        githubRepoUrl: 'https://github.com/harness-kanban/project-alpha',
        repoBaseBranch: 'main',
        checkCiCd: true,
        previewCommands: ['pnpm install', 'pnpm dev'],
        mcpConfig: {
          docs: {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
          },
        },
        workspaceId: 'workspace-123',
        createdBy: 'user-1',
        createdAt: '2026-03-11T00:00:00Z',
        updatedAt: '2026-03-11T00:00:00Z',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await waitForCondition(
      () => canvasElement.textContent?.includes('https://github.com/harness-kanban/project-alpha') ?? false,
    )

    const repoField = canvasElement.querySelector('#update-project-repo') as HTMLInputElement | null
    if (repoField) {
      throw new Error('Expected update mode repository field to render as read-only text instead of an input.')
    }

    if (!canvasElement.textContent?.includes('https://github.com/harness-kanban/project-alpha')) {
      throw new Error('Expected read-only repository text to render in update mode.')
    }

    if (canvasElement.textContent?.includes('Preview commands')) {
      throw new Error('Expected preview commands section to be removed from update mode.')
    }

    const mcpConfigField = canvasElement.querySelector('#update-project-mcp-config') as HTMLTextAreaElement | null
    await waitForCondition(() => Boolean(mcpConfigField?.value.includes('"docs"')))
    if (!mcpConfigField?.value.includes('"docs"')) {
      throw new Error('Expected existing MCP config to render in update mode.')
    }
  },
}

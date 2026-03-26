import { StoryLayout } from '../../../.storybook/components'
import { createIssuesHandler, createMockIssues } from '../../../.storybook/msw'
import { IssueListPage } from './list-page'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof IssueListPage> = {
  component: IssueListPage,
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

export const Default: Story = {}

export const WithManyIssues: Story = {
  parameters: {
    msw: {
      handlers: {
        issues: [createIssuesHandler({ issues: createMockIssues(20), total: 20 })],
      },
    },
  },
}

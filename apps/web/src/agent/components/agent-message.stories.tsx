import { Meta, StoryObj } from '@storybook/react'
import { AgentMessage } from './agent-message'

const meta: Meta<typeof AgentMessage> = {
  title: 'Agent/AgentMessage',
  component: AgentMessage,
}

export default meta

type Story = StoryObj<typeof AgentMessage>

export const UserMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'user',
      parts: [{ type: 'text', text: 'This is a user message with background color' }],
    },
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const AssistantMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'This is an AI message without background color' }],
    },
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const MultiPartMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'First part of the message. ' },
        { type: 'text', text: 'Second part with more details. ' },
        { type: 'text', text: 'Third part concluding the response.' },
      ],
    },
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const MarkdownMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: `# Issue Report

## Summary
A **critical** server outage occurred in the production environment.

## Details
- **Duration**: 2 hours
- **Affected Services**: API, Database
- **Root Cause**: Memory leak

## Code Snippet
\`\`\`typescript
const issue = {
  severity: 'critical',
  status: 'completed'
}
\`\`\`

> This issue has been completed.`,
        },
      ],
    },
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const MixedPartsMessage: Story = {
  args: {
    message: {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'I will help you create an issue and manage your todos.' },
        {
          type: 'tool-createIssue',
          toolCallId: 'call-1',
          state: 'output-available' as const,
          input: {
            propertyValues: [
              { propertyId: 'prop-1', value: 'Server Outage' },
              { propertyId: 'prop-2', value: 'high' },
            ],
          },
          output: {
            issueId: 123,
            success: true,
          },
        },
        { type: 'text', text: 'Now let me list your current todos:' },
        {
          type: 'tool-listTodos',
          toolCallId: 'call-2',
          state: 'output-available' as const,
          input: {},
          output: {
            items: [
              {
                id: 'todo-1',
                text: 'Buy milk',
                completed: false,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
              {
                id: 'todo-2',
                text: 'Walk dog',
                completed: true,
                createdAt: '2024-01-02T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
              },
            ],
            count: 2,
            completedCount: 1,
          },
        },
        {
          type: 'text',
          text: 'I have completed the issue creation and listed your todos. Is there anything else you need?',
        },
      ],
    },
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

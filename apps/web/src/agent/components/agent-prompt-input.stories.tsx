import { Meta, StoryObj } from '@storybook/react'
import { AgentPromptInput } from './agent-prompt-input'

const meta: Meta<typeof AgentPromptInput> = {
  title: 'Agent/AgentPromptInput',
  component: AgentPromptInput,
}

export default meta

type Story = StoryObj<typeof AgentPromptInput>

export const Default: Story = {
  args: {
    onSend: (message: string) => alert(`Sent: ${message}`),
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: {
    onSend: () => {},
    disabled: true,
    placeholder: 'Input is disabled...',
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const WaitingForStream: Story = {
  args: {
    onSend: () => {},
    status: 'submitted',
  },
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

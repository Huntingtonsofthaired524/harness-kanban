import { useState } from 'react'

import { Meta, StoryObj } from '@storybook/react'
import { AgentChat } from './agent-chat'
import { PastConversation } from './types'
import type { UIMessage } from '@ai-sdk/react'

// Main content to simulate page content (like layout.tsx children)
const MainContent = () => (
  <div className="p-8">
    <h1 className="mb-4 text-2xl font-bold">Main Dashboard</h1>
    <p className="text-muted-foreground mb-4">This is the main page content area.</p>
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg bg-gray-100 p-4">Card 1</div>
      <div className="rounded-lg bg-gray-100 p-4">Card 2</div>
      <div className="rounded-lg bg-gray-100 p-4">Card 3</div>
    </div>
  </div>
)

// Layout structure exactly like layout.tsx
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen flex-1 overflow-hidden">
    <div className="flex-1 overflow-auto">
      <MainContent />
    </div>
    <div className="h-screen w-[400px]">{children}</div>
  </div>
)

const meta: Meta<typeof AgentChat> = {
  title: 'Agent/AgentChat',
  component: AgentChat,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <LayoutWrapper>
        <Story />
      </LayoutWrapper>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof AgentChat>

// Helper to create UIMessage
const createUserMessage = (text: string): UIMessage => ({
  id: Date.now().toString(),
  role: 'user',
  parts: [{ type: 'text', text }],
})

const createAssistantMessage = (text: string): UIMessage => ({
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  parts: [{ type: 'text', text }],
})

// Helper component for interactive stories
const InteractiveAgentChat = () => {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready'>('ready')

  const handleSend = (input: string) => {
    const userMessage = createUserMessage(input)
    setMessages(prev => [...prev, userMessage])
    setStatus('submitted')

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = createAssistantMessage(`This is a simulated response to: "${input}"`)
      setMessages(prev => [...prev, aiMessage])
      setStatus('ready')
    }, 1500)
  }

  return <AgentChat messages={messages} onSend={handleSend} status={status} />
}

// Interactive story
export const Interactive: Story = {
  render: () => <InteractiveAgentChat />,
}

// Empty state story
export const Empty: Story = {
  args: {
    messages: [],
    onSend: () => {},
    onReset: () => {},
    onClose: () => {},
  },
}

// With messages story
export const WithMessages: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello! Can you help me create a new issue?' }],
      },
      {
        id: '2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Of course! I can help you create a new issue. What would you like to call it?',
          },
        ],
      },
      {
        id: '3',
        role: 'user',
        parts: [{ type: 'text', text: 'Let\'s call it "Server Outage in Production"' }],
      },
      {
        id: '4',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Great! I\'ve created the issue "Server Outage in Production". You can now add more details like severity, assignee, and description.',
          },
        ],
      },
    ],
    onSend: () => {},
    onReset: () => {},
    onClose: () => {},
  },
}

// Waiting for stream story (AI is responding)
export const WaitingForStream: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'What is the status of issue ISSUE-123?' }],
      },
    ],
    onSend: () => {},
    status: 'submitted',
    onReset: () => {},
    onClose: () => {},
  },
}

// Loading history story (fetching messages from server)
export const LoadingHistory: Story = {
  args: {
    messages: [],
    onSend: () => {},
    isLoading: true,
    onReset: () => {},
    onClose: () => {},
  },
}

// Error state story
export const WithError: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Help me with something' }],
      },
    ],
    onSend: () => {},
    error: new Error('Failed to connect to AI service'),
    onReset: () => {},
    onClose: () => {},
  },
}

// Sample past conversations for stories
const samplePastConversations: PastConversation[] = [
  {
    id: 'chat-1',
    title: 'Project Alpha Discussion',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'chat-2',
    title: 'Server Outage Issue',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'chat-3',
    title: 'Weekly Standup Notes',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
  },
  {
    id: 'chat-4',
    title: 'Q4 Planning Session',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: 'chat-5',
    title: 'Bug Triage Meeting',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  },
]

// With past conversations - empty state
export const WithPastConversationsEmpty: Story = {
  args: {
    messages: [],
    onSend: () => {},
    onReset: () => {},
    onClose: () => {},
    onSelectConversation: (id: string) => console.log('Selected conversation:', id),
    pastConversations: [],
  },
}

// With past conversations - with history
export const WithPastConversations: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello! Can you help me create a new issue?' }],
      },
      {
        id: '2',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Of course! I can help you create a new issue. What would you like to call it?',
          },
        ],
      },
    ],
    onSend: () => {},
    onReset: () => {},
    onClose: () => {},
    onSelectConversation: (id: string) => console.log('Selected conversation:', id),
    pastConversations: samplePastConversations,
    currentChatId: 'chat-1',
  },
}

// Generate a long list of past conversations for testing scroll behavior
const generateLongPastConversations = (count: number): PastConversation[] => {
  const titles = [
    'Project Alpha Discussion',
    'Server Outage Issue',
    'Weekly Standup Notes',
    'Q4 Planning Session',
    'Bug Triage Meeting',
    'Sprint Retrospective',
    'Deployment Strategy',
    'Customer Feedback Review',
    'API Design Discussion',
    'Database Migration Plan',
    'Security Audit Results',
    'Performance Optimization',
    'Feature Request Analysis',
    'Team Onboarding Guide',
    'Code Review Guidelines',
    'Release Notes Draft',
    'Incident Postmortem',
    'Architecture Decision Record',
    'Technical Debt Assessment',
    'User Interview Summary',
  ]

  // Generate conversations with descending time (newest first)
  return Array.from({ length: count }, (_, i) => {
    // Distribute conversations over past 30 days, newest first
    const totalMinutes = 30 * 24 * 60
    const minutesPerItem = totalMinutes / count
    const minutesAgo = Math.floor(i * minutesPerItem + Math.random() * minutesPerItem * 0.5)

    return {
      id: `chat-long-${i}`,
      title: titles[i % titles.length] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ''),
      updatedAt: new Date(Date.now() - minutesAgo * 60 * 1000),
    }
  })
}

// With a very long list of past conversations to test dropdown scroll
export const WithLongPastConversationsList: Story = {
  args: {
    messages: [],
    onSend: () => {},
    onReset: () => {},
    onClose: () => {},
    onSelectConversation: (id: string) => console.log('Selected conversation:', id),
    pastConversations: generateLongPastConversations(25),
    currentChatId: 'chat-long-5',
  },
}

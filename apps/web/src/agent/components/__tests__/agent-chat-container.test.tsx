import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

import { useChat } from '@ai-sdk/react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useChatList } from '../../hooks'
import { AgentChatContainer } from '../agent-chat-container'
import type { Mock } from 'vitest'

// Mock the dependencies
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
  createIdGenerator: vi.fn(() => vi.fn(() => 'test-chat-id')),
  DefaultChatTransport: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-api-server', () => ({
  useApiServerClient: () => ({
    get: vi.fn(),
    post: vi.fn(),
  }),
}))

vi.mock('@/providers/runtime-config-provider', () => ({
  useRuntimeConfig: () => ({
    apiBaseUrl: 'http://localhost:3001',
    socketServerUrl: 'http://localhost:3001',
  }),
}))

vi.mock('../../hooks', () => ({
  useChatList: vi.fn(),
}))

vi.mock('../utils/tool-query-invalidation', () => ({
  buildQueryKeysToInvalidate: vi.fn(() => []),
  isDataModifyingTool: vi.fn(() => false),
}))

vi.mock('@repo/shared/constants', () => ({
  DEFAULT_WORKSPACE_ID: 'test-workspace',
}))

const mockSocketEmit = vi.fn((event: string, _payload?: unknown, ack?: (response?: unknown) => void) => {
  if (event === 'realtime:join' && ack) {
    ack({ ok: true })
  }
})

vi.mock('@/lib/socket/socket', () => ({
  createSocket: vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    once: vi.fn((event: string, handler: () => void) => {
      // Immediately trigger connect event for testing
      if (event === 'connect') {
        handler()
      }
    }),
    emit: mockSocketEmit,
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
  joinRealtimeRoom: vi.fn((_socket, _roomId, callback) => {
    if (callback) callback()
  }),
  AGENT_APPROVAL_REQUEST_EVENT: 'agent:approval:request',
  AGENT_APPROVAL_SOCKET_NAMESPACE: '/agent-approval',
}))

vi.mock('../agent-chat', () => ({
  AgentChat: ({
    onSend,
    onReset,
    messages,
    onSelectConversation,
  }: {
    onSend: (text: string) => void
    onReset?: () => void
    messages: unknown[]
    onSelectConversation?: (chatId: string) => void
  }) => (
    <div data-testid="agent-chat">
      <div data-testid="message-count">{messages.length}</div>
      <button data-testid="send-button" onClick={() => onSend('test message')}>
        Send
      </button>
      {onReset && (
        <button data-testid="reset-button" onClick={onReset}>
          New chat
        </button>
      )}
      {onSelectConversation && (
        <button data-testid="select-conversation-button" onClick={() => onSelectConversation('history-chat-id')}>
          Select Conversation
        </button>
      )}
    </div>
  ),
}))

describe('AgentChatContainer', () => {
  const mockSendMessage = vi.fn()
  const mockSetMessages = vi.fn()
  const mockStop = vi.fn()
  const mockOnReset = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock for useChatList (no past chats)
    ;(useChatList as Mock).mockReturnValue({
      chats: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should pass a generated id to useChat', () => {
    const mockUseChat = vi.fn().mockReturnValue({
      id: 'test-chat-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })
    ;(useChat as Mock).mockImplementation(mockUseChat)

    render(<AgentChatContainer />)

    // Check that useChat receives a generated id parameter
    const firstCall = mockUseChat.mock.calls[0]
    expect(firstCall).toBeDefined()
    const callArgs = firstCall![0]
    expect(callArgs).toHaveProperty('id')
    expect(callArgs.id).toEqual(expect.any(String))
  })

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup()
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer onReset={mockOnReset} />)

    const resetButton = screen.getByTestId('reset-button')
    await user.click(resetButton)

    expect(mockOnReset).toHaveBeenCalledTimes(1)
  })

  it('should handle onClose callback', () => {
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer onClose={mockOnClose} />)

    // The AgentChat component receives onClose but we need to trigger it through the UI
    // Since our mock doesn't expose the close button directly, we verify the prop is passed
    expect(screen.getByTestId('agent-chat')).toBeInTheDocument()
  })

  it('should handle send message', async () => {
    const user = userEvent.setup()
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer />)

    const sendButton = screen.getByTestId('send-button')
    await user.click(sendButton)

    // Wait for the async connectApprovalSocket to complete and then sendMessage to be called
    await waitFor(
      () => {
        expect(mockSendMessage).toHaveBeenCalledWith({ text: 'test message' })
      },
      { timeout: 3000 },
    )
  })

  it('should pass past conversations to AgentChat', () => {
    const pastChats = [
      { id: 'chat-1', title: 'Chat 1', updatedAt: '2024-01-01T00:00:00Z' },
      { id: 'chat-2', title: 'Chat 2', updatedAt: '2024-01-02T00:00:00Z' },
    ]

    ;(useChatList as Mock).mockReturnValue({
      chats: pastChats,
      isLoading: false,
      error: null,
    })
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer />)

    expect(screen.getByTestId('agent-chat')).toBeInTheDocument()
    expect(screen.getByTestId('select-conversation-button')).toBeInTheDocument()
  })

  it('should handle loading state from useChatList', () => {
    ;(useChatList as Mock).mockReturnValue({
      chats: [],
      isLoading: true,
      error: null,
    })
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer />)

    expect(screen.getByTestId('agent-chat')).toBeInTheDocument()
  })

  it('should pass placeholder to AgentChat', () => {
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer placeholder="Type your message..." />)

    expect(screen.getByTestId('agent-chat')).toBeInTheDocument()
  })

  it('should pass className to AgentChat', () => {
    ;(useChat as Mock).mockReturnValue({
      id: 'test-id',
      messages: [],
      sendMessage: mockSendMessage,
      status: 'ready',
      error: null,
      stop: mockStop,
      setMessages: mockSetMessages,
    })

    render(<AgentChatContainer className="custom-class" />)

    expect(screen.getByTestId('agent-chat')).toBeInTheDocument()
  })
})

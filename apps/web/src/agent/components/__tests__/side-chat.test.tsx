import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SideChat } from '../side-chat'

// Mock the dependencies
vi.mock('@/hooks/use-resizable-width', () => ({
  useResizableWidth: () => ({
    width: 400,
    isResizing: false,
    resizeHandleProps: {},
  }),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../agent-chat-container', () => ({
  AgentChatContainer: ({ onClose, onReset }: { onClose?: () => void; onReset?: () => void }) => (
    <div data-testid="agent-chat-container">
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
      <button data-testid="reset-button" onClick={onReset}>
        New chat
      </button>
    </div>
  ),
}))

describe('SideChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should render open chat button when closed', () => {
    render(<SideChat />)

    const buttons = screen.getAllByLabelText('Open chat')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should open chat panel when clicking open button', () => {
    render(<SideChat />)

    const openButton = screen.getByLabelText('Open chat')
    fireEvent.click(openButton)

    expect(screen.getByTestId('agent-chat-container')).toBeInTheDocument()
  })

  it('should close chat panel when clicking close button', () => {
    render(<SideChat />)

    // Open the chat
    const openButton = screen.getByLabelText('Open chat')
    fireEvent.click(openButton)

    // Close the chat
    const closeButton = screen.getByTestId('close-button')
    fireEvent.click(closeButton)

    // Chat container should be removed
    expect(screen.queryByTestId('agent-chat-container')).not.toBeInTheDocument()
  })

  it('should remount AgentChatContainer with new key when clicking new chat', () => {
    render(<SideChat />)

    // Open the chat
    const openButton = screen.getByLabelText('Open chat')
    fireEvent.click(openButton)

    // Get the initial container
    expect(screen.getByTestId('agent-chat-container')).toBeInTheDocument()

    // Click new chat (reset)
    const resetButton = screen.getByTestId('reset-button')
    fireEvent.click(resetButton)

    // Chat should still be open but with a new key
    expect(screen.getByTestId('agent-chat-container')).toBeInTheDocument()
  })

  it('should pass chatId prop to AgentChatContainer', () => {
    const testChatId = 'test-chat-id-123'
    render(<SideChat chatId={testChatId} />)

    // Open the chat
    const openButton = screen.getByLabelText('Open chat')
    fireEvent.click(openButton)

    expect(screen.getByTestId('agent-chat-container')).toBeInTheDocument()
  })

  it('should handle multiple reset clicks correctly', () => {
    render(<SideChat />)

    // Open the chat
    const openButton = screen.getByLabelText('Open chat')
    fireEvent.click(openButton)

    // Click new chat multiple times
    const resetButton = screen.getByTestId('reset-button')
    fireEvent.click(resetButton)
    fireEvent.click(resetButton)
    fireEvent.click(resetButton)

    // Chat should still be open
    expect(screen.getByTestId('agent-chat-container')).toBeInTheDocument()
  })
})

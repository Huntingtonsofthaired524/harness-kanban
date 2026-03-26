'use client'

import { createIdGenerator, DefaultChatTransport } from 'ai'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useApiServerClient } from '@/hooks/use-api-server'
import {
  AGENT_APPROVAL_REQUEST_EVENT,
  AGENT_APPROVAL_SOCKET_NAMESPACE,
  createSocket,
  joinRealtimeRoom,
} from '@/lib/socket/socket'
import { useRuntimeConfig } from '@/providers/runtime-config-provider'
import { useChat } from '@ai-sdk/react'
import { AGENT_APPROVAL_SOCKET_EVENTS, REALTIME_SOCKET_EVENTS } from '@repo/shared'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useChatList } from '../hooks'
import { ChatHistoryResponse } from '../hooks/use-chat-history'
import { buildQueryKeysToInvalidate, isDataModifyingTool } from '../utils/tool-query-invalidation'
import { AgentChat } from './agent-chat'
import { ToolApprovalProvider } from './tool-approval-context'
import type { AgentApprovalRequestEvent, AgentApprovalResponseEvent } from '@repo/shared'
import type { ToolUIPart, UIMessage } from 'ai'
import type { Socket } from 'socket.io-client'
import type { ToolApprovalState } from './tool-approval-context'
import type { PastConversation } from './types'

interface AgentChatContainerProps {
  placeholder?: string
  onClose?: () => void
  onReset?: () => void
  className?: string
}

function emitApprovalResponse(socket: Socket, payload: AgentApprovalResponseEvent, ack?: () => void): void {
  socket.emit(
    REALTIME_SOCKET_EVENTS.inbound,
    {
      event: AGENT_APPROVAL_SOCKET_EVENTS.response,
      payload,
    },
    ack,
  )
}

async function joinApprovalRoom(socket: Socket, roomId: string): Promise<void> {
  await new Promise<void>(resolve => {
    let resolved = false
    const timer = window.setTimeout(() => {
      if (resolved) return
      resolved = true
      resolve()
    }, 3000)

    joinRealtimeRoom(socket, roomId, () => {
      if (resolved) return
      resolved = true
      window.clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Container component that connects AgentChat to backend API using useChat
 */
export function AgentChatContainer({ placeholder, onClose, onReset, className }: AgentChatContainerProps) {
  const orgId = DEFAULT_WORKSPACE_ID
  const queryClient = useQueryClient()
  const apiClient = useApiServerClient()
  const { apiBaseUrl, socketServerUrl } = useRuntimeConfig()

  const [chatId, setChatId] = useState(createIdGenerator()())
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const { chats: pastChats } = useChatList()

  const processedToolCallIds = useRef<Set<string>>(new Set())
  const approvalSocketRef = useRef<Socket | null>(null)
  const approvalChatIdByToolCallIdRef = useRef<Record<string, string>>({})
  const [approvalStates, setApprovalStates] = useState<Record<string, ToolApprovalState>>({})

  const disconnectApprovalSocket = useCallback(() => {
    const socket = approvalSocketRef.current
    if (!socket) return

    socket.disconnect()
    approvalSocketRef.current = null
  }, [])

  const connectApprovalSocket = useCallback(
    async (currentChatId: string) => {
      const existingSocket = approvalSocketRef.current
      if (existingSocket) {
        if (!existingSocket.connected) {
          await new Promise<void>(resolve => {
            let resolved = false
            const timer = window.setTimeout(() => {
              if (resolved) return
              resolved = true
              resolve()
            }, 3000)

            existingSocket.once('connect', () => {
              if (resolved) return
              resolved = true
              window.clearTimeout(timer)
              resolve()
            })
            existingSocket.once('connect_error', () => {
              if (resolved) return
              resolved = true
              window.clearTimeout(timer)
              resolve()
            })
          })
        }

        if (existingSocket.connected) {
          await joinApprovalRoom(existingSocket, currentChatId)
        }
        return existingSocket
      }

      const socket = createSocket(AGENT_APPROVAL_SOCKET_NAMESPACE, socketServerUrl)

      socket.on('connect', () => {
        joinRealtimeRoom(socket, currentChatId)
      })

      socket.on(AGENT_APPROVAL_REQUEST_EVENT, (event: AgentApprovalRequestEvent) => {
        if (!event?.toolCallId) return
        if (event.chatId) {
          approvalChatIdByToolCallIdRef.current[event.toolCallId] = event.chatId
        }
        setApprovalStates(prev => ({
          ...prev,
          [event.toolCallId]: 'approval-requested',
        }))
      })

      approvalSocketRef.current = socket

      if (!socket.connected) {
        await new Promise<void>(resolve => {
          let resolved = false
          const timer = window.setTimeout(() => {
            if (resolved) return
            resolved = true
            resolve()
          }, 3000)

          socket.once('connect', () => {
            if (resolved) return
            resolved = true
            window.clearTimeout(timer)
            resolve()
          })
          socket.once('connect_error', () => {
            if (resolved) return
            resolved = true
            window.clearTimeout(timer)
            resolve()
          })
        })
      }

      if (socket.connected) {
        await joinApprovalRoom(socket, currentChatId)
      }

      return socket
    },
    [setApprovalStates, socketServerUrl],
  )

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
    stop,
    setMessages,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: `${apiBaseUrl}/api/v1/agent/chat`,
      credentials: 'include',
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } }
      },
    }),
    onFinish: () => {
      disconnectApprovalSocket()
      approvalChatIdByToolCallIdRef.current = {}
      setApprovalStates({})
    },
  })

  const respondToolCall = useCallback(
    async (toolCallId: string, approved: boolean, reason?: string) => {
      const socket = approvalSocketRef.current
      const approvalEntry = approvalStates[toolCallId]
      const currentChatId = approvalChatIdByToolCallIdRef.current[toolCallId] ?? chatId
      if (!socket || !approvalEntry || !currentChatId) return

      setApprovalStates(prev => ({
        ...prev,
        [toolCallId]: 'responding',
      }))

      await new Promise<void>(resolve => {
        let resolved = false
        const timer = window.setTimeout(() => {
          if (resolved) return
          resolved = true
          resolve()
        }, 3000)

        emitApprovalResponse(
          socket,
          {
            chatId: currentChatId,
            toolCallId,
            approved,
            reason,
          },
          () => {
            if (resolved) return
            resolved = true
            window.clearTimeout(timer)
            resolve()
          },
        )
      })

      setApprovalStates(prev => {
        const current = prev[toolCallId]
        if (!current) return prev
        delete approvalChatIdByToolCallIdRef.current[toolCallId]
        return {
          ...prev,
          [toolCallId]: 'responded',
        }
      })
    },
    [approvalStates, chatId],
  )

  // Keep a safety cleanup on unmount.
  useEffect(() => {
    return () => {
      approvalChatIdByToolCallIdRef.current = {}
      disconnectApprovalSocket()
    }
  }, [disconnectApprovalSocket])

  // Listen for tool execution completion and invalidate queries for frontend data refresh
  useEffect(() => {
    const assistantMessages = messages.filter((m: UIMessage) => m.role === 'assistant')
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
    if (!lastAssistantMessage || !lastAssistantMessage.parts) return

    const toolParts = lastAssistantMessage.parts.filter((part): part is ToolUIPart => part.type.startsWith('tool-'))

    for (const part of toolParts) {
      // Extract tool name from type (e.g., "tool-createComment" -> "createComment")
      const toolName = part.type.replace('tool-', '')

      // Only process when tool execution is complete (output-available state)
      if (part.state === 'output-available' && !processedToolCallIds.current.has(part.toolCallId)) {
        processedToolCallIds.current.add(part.toolCallId)

        if (isDataModifyingTool(toolName)) {
          const toolInput = (part.input ?? {}) as Record<string, unknown>
          const queryKeys = buildQueryKeysToInvalidate(toolName, toolInput, orgId)
          console.log('[AgentChat] Tool executed, invalidating queries:', toolName, queryKeys)

          for (const queryKey of queryKeys) {
            queryClient.invalidateQueries({ queryKey })
          }
        }
      }
    }
  }, [messages, orgId, queryClient])

  // Handle sending message
  const handleSend = useCallback(
    (text: string) => {
      connectApprovalSocket(chatId).finally(() => {
        sendMessage({ text })
      })
    },
    [chatId, connectApprovalSocket, sendMessage],
  )

  // Handle reset chat - clear messages and notify parent to remount component
  const handleReset = useCallback(() => {
    // Call parent's onReset to remount the entire component with a new key
    // This ensures useChat creates a fresh chat instance
    onReset?.()
  }, [onReset])

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback(
    async (selectedChatId: string) => {
      setIsLoadingHistory(true)
      setChatId(selectedChatId)
      try {
        const response = await apiClient?.get<ChatHistoryResponse>(`/api/v1/agent/chat/${selectedChatId}/history`)
        if (!response?.success) {
          throw new Error(response?.error?.message || 'Failed to fetch chat history')
        }
        setMessages(response.data.messages)
      } catch (err) {
        console.error('Failed to load chat history:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [apiClient, setMessages],
  )

  // Convert pastChats to PastConversation format (convert string date to Date)
  const pastConversations: PastConversation[] = React.useMemo(() => {
    if (!pastChats) return []
    return pastChats.map(chat => ({
      id: chat.id,
      title: chat.title ?? 'Untitled',
      updatedAt: new Date(chat.updatedAt),
    }))
  }, [pastChats])

  const displayError = chatError || null

  return (
    <ToolApprovalProvider
      value={{
        approvalStates,
        respondToolCall,
      }}>
      <AgentChat
        messages={messages}
        onSend={handleSend}
        isLoading={isLoadingHistory}
        status={status}
        error={displayError}
        placeholder={placeholder}
        onClose={onClose}
        className={className}
        onStop={stop}
        onReset={handleReset}
        onSelectConversation={handleSelectConversation}
        pastConversations={pastConversations}
        currentChatId={chatId}
      />
    </ToolApprovalProvider>
  )
}

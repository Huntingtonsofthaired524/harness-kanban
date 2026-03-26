import { http } from 'msw/core/http'

import type { UIMessage } from 'ai'

export type MockAgentChatListItem = {
  id: string
  title: string | null
  updatedAt: string
}

export type MockAgentChatHistory = {
  id: string
  title: string | null
  createdAt: string
  messages: UIMessage[]
}

export const defaultAgentChats: MockAgentChatListItem[] = [
  {
    id: 'chat-1',
    title: 'Troubleshoot issue priorities',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'chat-2',
    title: 'Draft incident update',
    updatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
]

const defaultHistoryById: Record<string, MockAgentChatHistory> = {
  'chat-1': {
    id: 'chat-1',
    title: 'Troubleshoot issue priorities',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    messages: [
      { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Show me urgent issues' }] },
      {
        id: 'msg-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'I found 3 high-priority issues that need attention.' }],
      },
    ],
  },
  'chat-2': {
    id: 'chat-2',
    title: 'Draft incident update',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    messages: [
      { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: 'Draft a status update for leadership.' }] },
      { id: 'msg-4', role: 'assistant', parts: [{ type: 'text', text: 'Draft prepared. Want a shorter version?' }] },
    ],
  },
}

export const createAgentChatsHandler = (
  chats: MockAgentChatListItem[] = defaultAgentChats,
): ReturnType<typeof http.get> =>
  http.get('*/api/v1/agent/chats', () =>
    Response.json({
      success: true,
      data: chats,
      error: null,
    }),
  )

export const createAgentChatHistoryHandler = (
  historyById: Record<string, MockAgentChatHistory> = defaultHistoryById,
): ReturnType<typeof http.get> =>
  http.get('*/api/v1/agent/chat/:chatId/history', ({ params }) => {
    const chatId = String(params.chatId)
    const history = historyById[chatId] ?? {
      id: chatId,
      title: null,
      createdAt: new Date().toISOString(),
      messages: [],
    }

    return Response.json({
      success: true,
      data: history,
      error: null,
    })
  })

export const createAgentSaveMessagesHandler = (): ReturnType<typeof http.post> =>
  http.post('*/api/v1/agent/chat/:chatId/messages', () =>
    Response.json({
      success: true,
      data: {
        success: true,
      },
      error: null,
    }),
  )

export const createAgentChatHandler = (): ReturnType<typeof http.post> =>
  http.post('*/api/v1/agent/chat', () =>
    Response.json(
      {
        success: false,
        data: null,
        error: {
          code: 'NOT_IMPLEMENTED_IN_STORYBOOK',
          message: 'Streaming agent chat is not mocked yet. Use component args stories for chat transcript demos.',
        },
      },
      { status: 501 },
    ),
  )

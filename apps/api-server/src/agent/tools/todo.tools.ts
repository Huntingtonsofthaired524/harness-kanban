import { tool } from 'ai'
import { z } from 'zod'

import {
  ADD_MULTIPLE_TODOS_TOOL,
  DELETE_MULTIPLE_TODOS_TOOL,
  LIST_TODOS_TOOL,
  TOGGLE_MULTIPLE_TODOS_TOOL,
} from '@repo/shared'
import type { ChatState, TodoItem } from '@repo/shared'

export interface TodoToolsDependencies {
  getChatState: () => Promise<ChatState>
  updateChatState: (state: ChatState) => Promise<void>
}

export function createListTodosTool({ getChatState }: TodoToolsDependencies) {
  return tool({
    description:
      'List all todo items in the current chat. IMPORTANT: These todos are for AI use only - they are internal tracking items for the AI to manage complex multi-step tasks, NOT user-facing todos. Use this to check the current task status when handling complex or multi-step tasks. Feel free to dynamically add or update todos as the task progresses based on user needs.',
    inputSchema: z.object({}),
    execute: async () => {
      const state = await getChatState()
      const items = state.todoList?.items ?? []
      return {
        items,
        count: items.length,
        completedCount: items.filter((item: TodoItem) => item.completed).length,
      }
    },
  })
}

export function createAddMultipleTodosTool({ getChatState, updateChatState }: TodoToolsDependencies) {
  return tool({
    description:
      'Add multiple todo items to the current chat in a single operation. IMPORTANT: These todos are for AI use only - they are internal tracking items for the AI to manage complex multi-step tasks, NOT user-facing todos. Useful for batch creating todos when initializing a complex task with multiple subtasks. Can also be used to add a single todo by passing an array with one item.',
    inputSchema: z.object({
      items: z
        .array(
          z.object({
            text: z.string().min(1).describe('The todo item text'),
          }),
        )
        .min(1)
        .describe('Array of todo items to add'),
    }),
    execute: async ({ items }) => {
      const state = await getChatState()
      const now = new Date().toISOString()

      const newTodos: TodoItem[] = items.map(item => ({
        id: crypto.randomUUID(),
        text: item.text,
        completed: false,
        createdAt: now,
        updatedAt: now,
      }))

      const updatedState: ChatState = {
        ...state,
        todoList: {
          items: [...(state.todoList?.items ?? []), ...newTodos],
        },
      }

      await updateChatState(updatedState)

      return {
        success: true,
        todos: newTodos,
        count: newTodos.length,
      }
    },
  })
}

export function createToggleMultipleTodosTool({ getChatState, updateChatState }: TodoToolsDependencies) {
  return tool({
    description:
      'Toggle the completed status of multiple todo items in a single operation. IMPORTANT: These todos are for AI use only - they are internal tracking items for the AI to manage complex multi-step tasks, NOT user-facing todos. Useful for batch marking subtasks as done. Can also be used to toggle a single todo by passing an array with one ID.',
    inputSchema: z.object({
      ids: z.array(z.string()).min(1).describe('Array of todo item IDs to toggle'),
    }),
    execute: async ({ ids }) => {
      const state = await getChatState()
      const items = state.todoList?.items ?? []

      const toggled: TodoItem[] = []
      const notFound: string[] = []
      const updatedItems = [...items]

      for (const id of ids) {
        const todoIndex = items.findIndex((item: TodoItem) => item.id === id)
        if (todoIndex === -1) {
          notFound.push(id)
        } else {
          updatedItems[todoIndex] = {
            ...updatedItems[todoIndex],
            completed: !updatedItems[todoIndex].completed,
            updatedAt: new Date().toISOString(),
          }
          toggled.push(updatedItems[todoIndex])
        }
      }

      const updatedState: ChatState = {
        ...state,
        todoList: {
          items: updatedItems,
        },
      }

      await updateChatState(updatedState)

      return {
        success: toggled.length > 0,
        toggled,
        notFound,
        count: toggled.length,
      }
    },
  })
}

export function createDeleteMultipleTodosTool({ getChatState, updateChatState }: TodoToolsDependencies) {
  return tool({
    description:
      'Delete multiple todo items from the current chat in a single operation. IMPORTANT: These todos are for AI use only - they are internal tracking items for the AI to manage complex multi-step tasks, NOT user-facing todos. Useful for batch cleaning up todos that are no longer relevant. Can also be used to delete a single todo by passing an array with one ID.',
    inputSchema: z.object({
      ids: z.array(z.string()).min(1).describe('Array of todo item IDs to delete'),
    }),
    execute: async ({ ids }) => {
      const state = await getChatState()
      const items = state.todoList?.items ?? []

      const deleted: TodoItem[] = []
      const notFound: string[] = []

      for (const id of ids) {
        const todoIndex = items.findIndex((item: TodoItem) => item.id === id)
        if (todoIndex === -1) {
          notFound.push(id)
        } else {
          deleted.push(items[todoIndex])
        }
      }

      const updatedItems = items.filter((item: TodoItem) => !ids.includes(item.id))

      const updatedState: ChatState = {
        ...state,
        todoList: {
          items: updatedItems,
        },
      }

      await updateChatState(updatedState)

      return {
        success: deleted.length > 0,
        deleted,
        notFound,
        remainingCount: updatedItems.length,
      }
    },
  })
}

export const todoTools = {
  [LIST_TODOS_TOOL]: createListTodosTool,
  [ADD_MULTIPLE_TODOS_TOOL]: createAddMultipleTodosTool,
  [TOGGLE_MULTIPLE_TODOS_TOOL]: createToggleMultipleTodosTool,
  [DELETE_MULTIPLE_TODOS_TOOL]: createDeleteMultipleTodosTool,
}

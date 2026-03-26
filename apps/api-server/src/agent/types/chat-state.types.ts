/**
 * Chat state types for storing extended stateful information in chat metadata
 *
 * The state is stored in Chat.metadata.state and managed through AI tools.
 * Each feature should use its own namespace to avoid conflicts.
 */

/**
 * Todo item structure
 */
export interface TodoItem {
  /** Unique identifier for the todo item */
  id: string
  /** The todo text content */
  text: string
  /** Whether the todo is completed */
  completed: boolean
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Todo list state namespace
 */
export interface TodoListState {
  /** List of todo items */
  items: TodoItem[]
}

/**
 * Main chat state interface - all stateful features should extend this
 *
 * Naming convention: Use camelCase feature names as keys
 * Example: todoList, calendarEvents, notes, etc.
 */
export interface ChatState {
  /** Todo list feature */
  todoList?: TodoListState
}

/**
 * Chat metadata structure
 */
export interface ChatMetadata {
  /** Extended state for various features */
  state?: ChatState
}

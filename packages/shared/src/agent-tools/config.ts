import {
  ADD_MULTIPLE_TODOS_TOOL,
  ADD_SUBSCRIBER_TOOL,
  CREATE_COMMENT_TOOL,
  CREATE_ISSUE_TOOL,
  DELETE_COMMENT_TOOL,
  DELETE_ISSUE_TOOL,
  DELETE_MULTIPLE_TODOS_TOOL,
  GET_AVAILABLE_USERS_TOOL,
  GET_COMMENTS_TOOL,
  GET_CURRENT_USER_TOOL,
  GET_ISSUE_BY_ID_TOOL,
  GET_ISSUES_TOOL,
  GET_SUBSCRIBERS_TOOL,
  LIST_TODOS_TOOL,
  QUERY_PROPERTIES_TOOL,
  REMOVE_SUBSCRIBER_TOOL,
  SEMANTIC_SEARCH_ISSUES_TOOL,
  TOGGLE_MULTIPLE_TODOS_TOOL,
  UPDATE_COMMENT_TOOL,
  UPDATE_ISSUE_TOOL,
} from './constants'
import type { ToolName } from './constants'

/**
 * Agent Tool UI Configuration
 *
 * These configurations define UI-related properties for tools.
 * Primarily used by the frontend for rendering.
 */

/**
 * UI Configuration for a tool
 */
export interface ToolUIConfig {
  /** Display title for the tool */
  title: string
  /** Whether to show input in the UI */
  showInput: boolean
  /** Whether to show output in the UI */
  showOutput: boolean
  /** Default open state for the tool panel */
  defaultOpen: boolean
}

/**
 * UI configurations for all tools
 */
export const TOOL_UI_CONFIG: Record<ToolName, ToolUIConfig> = {
  [QUERY_PROPERTIES_TOOL]: {
    title: 'Query Properties',
    showInput: false,
    showOutput: true,
    defaultOpen: false,
  },
  [CREATE_ISSUE_TOOL]: {
    title: 'Create Issue',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [GET_ISSUES_TOOL]: {
    title: 'Get Issues',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [SEMANTIC_SEARCH_ISSUES_TOOL]: {
    title: 'Semantic Search Issues',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [GET_ISSUE_BY_ID_TOOL]: {
    title: 'Get Issue Details',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [UPDATE_ISSUE_TOOL]: {
    title: 'Update Issue',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [DELETE_ISSUE_TOOL]: {
    title: 'Delete Issue',
    showInput: true,
    showOutput: true,
    defaultOpen: true,
  },
  [GET_COMMENTS_TOOL]: {
    title: 'Get Comments',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [CREATE_COMMENT_TOOL]: {
    title: 'Create Comment',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [UPDATE_COMMENT_TOOL]: {
    title: 'Update Comment',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [DELETE_COMMENT_TOOL]: {
    title: 'Delete Comment',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [GET_SUBSCRIBERS_TOOL]: {
    title: 'Get Subscribers',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [ADD_SUBSCRIBER_TOOL]: {
    title: 'Add Subscriber',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [REMOVE_SUBSCRIBER_TOOL]: {
    title: 'Remove Subscriber',
    showInput: true,
    showOutput: true,
    defaultOpen: false,
  },
  [GET_AVAILABLE_USERS_TOOL]: {
    title: 'Get Available Users',
    showInput: false,
    showOutput: true,
    defaultOpen: false,
  },
  [GET_CURRENT_USER_TOOL]: {
    title: 'Get Current User',
    showInput: false,
    showOutput: false,
    defaultOpen: false,
  },
  [LIST_TODOS_TOOL]: {
    title: 'List Todos',
    showInput: false,
    showOutput: true,
    defaultOpen: true,
  },
  [ADD_MULTIPLE_TODOS_TOOL]: {
    title: 'Add Todos',
    showInput: false,
    showOutput: true,
    defaultOpen: true,
  },
  [TOGGLE_MULTIPLE_TODOS_TOOL]: {
    title: 'Toggle Todos',
    showInput: false,
    showOutput: true,
    defaultOpen: true,
  },
  [DELETE_MULTIPLE_TODOS_TOOL]: {
    title: 'Delete Todos',
    showInput: false,
    showOutput: true,
    defaultOpen: true,
  },
}

/**
 * Get UI config for a tool
 */
export function getToolUIConfig(toolName: ToolName): ToolUIConfig {
  return TOOL_UI_CONFIG[toolName]
}

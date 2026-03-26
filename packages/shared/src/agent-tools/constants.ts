/**
 * Agent Tool Names
 *
 * These constants define all available tool names for the agent system.
 * They are used by both frontend and backend to ensure consistency.
 */

// Property & Issue Tools
export const QUERY_PROPERTIES_TOOL = 'queryProperties' as const
export const CREATE_ISSUE_TOOL = 'createIssue' as const
export const GET_ISSUES_TOOL = 'getIssues' as const
export const SEMANTIC_SEARCH_ISSUES_TOOL = 'semanticSearchIssues' as const
export const GET_ISSUE_BY_ID_TOOL = 'getIssueById' as const
export const UPDATE_ISSUE_TOOL = 'updateIssue' as const
export const DELETE_ISSUE_TOOL = 'deleteIssue' as const

// Comment Tools
export const GET_COMMENTS_TOOL = 'getComments' as const
export const CREATE_COMMENT_TOOL = 'createComment' as const
export const UPDATE_COMMENT_TOOL = 'updateComment' as const
export const DELETE_COMMENT_TOOL = 'deleteComment' as const

// Subscription Tools
export const GET_SUBSCRIBERS_TOOL = 'getSubscribers' as const
export const ADD_SUBSCRIBER_TOOL = 'addSubscriber' as const
export const REMOVE_SUBSCRIBER_TOOL = 'removeSubscriber' as const

// User Tools
export const GET_AVAILABLE_USERS_TOOL = 'getAvailableUsers' as const
export const GET_CURRENT_USER_TOOL = 'getCurrentUser' as const

// Todo List Tools
export const LIST_TODOS_TOOL = 'listTodos' as const
export const ADD_MULTIPLE_TODOS_TOOL = 'addMultipleTodos' as const
export const TOGGLE_MULTIPLE_TODOS_TOOL = 'toggleMultipleTodos' as const
export const DELETE_MULTIPLE_TODOS_TOOL = 'deleteMultipleTodos' as const

/**
 * Union type of all tool names
 */
export type ToolName =
  | typeof QUERY_PROPERTIES_TOOL
  | typeof CREATE_ISSUE_TOOL
  | typeof GET_ISSUES_TOOL
  | typeof SEMANTIC_SEARCH_ISSUES_TOOL
  | typeof GET_ISSUE_BY_ID_TOOL
  | typeof UPDATE_ISSUE_TOOL
  | typeof DELETE_ISSUE_TOOL
  | typeof GET_COMMENTS_TOOL
  | typeof CREATE_COMMENT_TOOL
  | typeof UPDATE_COMMENT_TOOL
  | typeof DELETE_COMMENT_TOOL
  | typeof GET_SUBSCRIBERS_TOOL
  | typeof ADD_SUBSCRIBER_TOOL
  | typeof REMOVE_SUBSCRIBER_TOOL
  | typeof GET_AVAILABLE_USERS_TOOL
  | typeof GET_CURRENT_USER_TOOL
  | typeof LIST_TODOS_TOOL
  | typeof ADD_MULTIPLE_TODOS_TOOL
  | typeof TOGGLE_MULTIPLE_TODOS_TOOL
  | typeof DELETE_MULTIPLE_TODOS_TOOL

/**
 * Array of all tool names for iteration
 */
export const ALL_TOOL_NAMES: ToolName[] = [
  QUERY_PROPERTIES_TOOL,
  CREATE_ISSUE_TOOL,
  GET_ISSUES_TOOL,
  SEMANTIC_SEARCH_ISSUES_TOOL,
  GET_ISSUE_BY_ID_TOOL,
  UPDATE_ISSUE_TOOL,
  DELETE_ISSUE_TOOL,
  GET_COMMENTS_TOOL,
  CREATE_COMMENT_TOOL,
  UPDATE_COMMENT_TOOL,
  DELETE_COMMENT_TOOL,
  GET_SUBSCRIBERS_TOOL,
  ADD_SUBSCRIBER_TOOL,
  REMOVE_SUBSCRIBER_TOOL,
  GET_AVAILABLE_USERS_TOOL,
  GET_CURRENT_USER_TOOL,
  LIST_TODOS_TOOL,
  ADD_MULTIPLE_TODOS_TOOL,
  TOGGLE_MULTIPLE_TODOS_TOOL,
  DELETE_MULTIPLE_TODOS_TOOL,
]

/**
 * Check if a string is a valid tool name
 */
export function isValidToolName(name: string): name is ToolName {
  return ALL_TOOL_NAMES.includes(name as ToolName)
}

import {
  createAgentChatHandler,
  createAgentChatHistoryHandler,
  createAgentChatsHandler,
  createAgentSaveMessagesHandler,
} from './apis/agent'
import { createSessionHandler, createSignOutHandler } from './apis/auth'
import {
  createIssuesHandler,
  createMockIssues,
  createStatusActionsHandler,
  createUpdateIssueHandler,
} from './apis/issues'
import { createProjectsHandler } from './apis/projects'
import { createPropertiesHandler } from './apis/properties'
import { createUsersHandler } from './apis/users'

type MswHandler =
  | ReturnType<typeof createAgentChatHandler>
  | ReturnType<typeof createAgentChatHistoryHandler>
  | ReturnType<typeof createAgentChatsHandler>
  | ReturnType<typeof createAgentSaveMessagesHandler>
  | ReturnType<typeof createSessionHandler>
  | ReturnType<typeof createSignOutHandler>
  | ReturnType<typeof createIssuesHandler>
  | ReturnType<typeof createUpdateIssueHandler>
  | ReturnType<typeof createStatusActionsHandler>
  | ReturnType<typeof createPropertiesHandler>
  | ReturnType<typeof createProjectsHandler>
  | ReturnType<typeof createUsersHandler>

type MswHandlerGroupKey = 'auth' | 'properties' | 'issues' | 'projects' | 'users' | 'agent'

export const defaultMswHandlerGroups: Record<MswHandlerGroupKey, MswHandler[]> = {
  auth: [createSessionHandler(), createSignOutHandler()],
  properties: [createPropertiesHandler()],
  issues: (() => {
    const issues = createMockIssues()
    return [createIssuesHandler({ issues }), createUpdateIssueHandler({ issues }), createStatusActionsHandler(issues)]
  })(),
  projects: [createProjectsHandler()],
  users: [createUsersHandler()],
  agent: [
    createAgentChatsHandler(),
    createAgentChatHistoryHandler(),
    createAgentSaveMessagesHandler(),
    createAgentChatHandler(),
  ],
}

export const defaultMswHandlers: MswHandler[] = Object.values(defaultMswHandlerGroups).flat()

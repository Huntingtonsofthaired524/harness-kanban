import {
  createAgentChatHandler,
  createAgentChatHistoryHandler,
  createAgentChatsHandler,
  createAgentSaveMessagesHandler,
} from './apis/agent'
import { createSessionHandler, createSignOutHandler } from './apis/auth'
import { createCodingAgentHandlers } from './apis/coding-agents'
import {
  createDeleteGithubConnectionHandler,
  createGithubBranchesHandler,
  createGithubConnectionHandler,
  createGithubRepositoriesHandler,
  createUpdateGithubConnectionHandler,
} from './apis/github'
import {
  createIssueActivitiesHandler,
  createIssueCommentHandler,
  createIssueCommentsHandler,
  createIssueHandler,
  createIssuesHandler,
  createMockIssues,
  createStatusActionsHandler,
  createSubscribeIssueHandler,
  createUnsubscribeIssueHandler,
  createUpdateIssueHandler,
} from './apis/issues'
import { createProjectsHandler } from './apis/projects'
import { createPropertiesHandler } from './apis/properties'
import { createUsersHandler } from './apis/users'
import type { Activity, Comment } from '@repo/shared/issue/types'

type MswHandler =
  | ReturnType<typeof createAgentChatHandler>
  | ReturnType<typeof createAgentChatHistoryHandler>
  | ReturnType<typeof createAgentChatsHandler>
  | ReturnType<typeof createAgentSaveMessagesHandler>
  | ReturnType<typeof createCodingAgentHandlers>[number]
  | ReturnType<typeof createSessionHandler>
  | ReturnType<typeof createSignOutHandler>
  | ReturnType<typeof createIssuesHandler>
  | ReturnType<typeof createIssueHandler>
  | ReturnType<typeof createUpdateIssueHandler>
  | ReturnType<typeof createStatusActionsHandler>
  | ReturnType<typeof createIssueActivitiesHandler>
  | ReturnType<typeof createSubscribeIssueHandler>
  | ReturnType<typeof createUnsubscribeIssueHandler>
  | ReturnType<typeof createIssueCommentsHandler>
  | ReturnType<typeof createIssueCommentHandler>
  | ReturnType<typeof createDeleteGithubConnectionHandler>
  | ReturnType<typeof createGithubBranchesHandler>
  | ReturnType<typeof createGithubConnectionHandler>
  | ReturnType<typeof createGithubRepositoriesHandler>
  | ReturnType<typeof createUpdateGithubConnectionHandler>
  | ReturnType<typeof createPropertiesHandler>
  | ReturnType<typeof createProjectsHandler>
  | ReturnType<typeof createUsersHandler>

type MswHandlerGroupKey = 'auth' | 'properties' | 'issues' | 'projects' | 'users' | 'agent' | 'github' | 'codingAgents'

export const defaultMswHandlerGroups: Record<MswHandlerGroupKey, MswHandler[]> = {
  auth: [createSessionHandler(), createSignOutHandler()],
  codingAgents: createCodingAgentHandlers(),
  github: [
    createGithubConnectionHandler(),
    createUpdateGithubConnectionHandler(),
    createDeleteGithubConnectionHandler(),
    createGithubRepositoriesHandler(),
    createGithubBranchesHandler(),
  ],
  properties: [createPropertiesHandler()],
  issues: (() => {
    const issues = createMockIssues()
    const activities: Activity[] = []
    const subscriberIds: string[] = []
    const comments: Comment[] = []

    return [
      createIssuesHandler({ issues }),
      createIssueHandler(issues),
      createUpdateIssueHandler({ issues }),
      createStatusActionsHandler(issues),
      createIssueActivitiesHandler({ activities, subscriberIds }),
      createSubscribeIssueHandler(subscriberIds),
      createUnsubscribeIssueHandler(subscriberIds),
      createIssueCommentsHandler(comments),
      createIssueCommentHandler(comments, activities),
    ]
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

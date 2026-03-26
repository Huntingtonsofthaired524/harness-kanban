import { tool } from 'ai'
import { z } from 'zod'

import { CREATE_COMMENT_TOOL, DELETE_COMMENT_TOOL, GET_COMMENTS_TOOL, UPDATE_COMMENT_TOOL } from '@repo/shared'
import type { AgentToolsContext } from './types'

export function createGetCommentsTool({ commentService }: AgentToolsContext) {
  return tool({
    description: 'Get all comments for a specific issue',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to get comments for'),
    }),
    execute: async ({ issueId }) => {
      const comments = await commentService.queryComments(issueId)
      return {
        comments,
      }
    },
  })
}

export function createCreateCommentTool({ commentService, userId }: AgentToolsContext) {
  return tool({
    description: 'Create a new comment on an issue. Use this to add comments or replies.',
    inputSchema: z.object({
      issueId: z.number().describe('The ID of the issue to comment on'),
      content: z.string().min(1).describe('The comment content'),
      parentId: z.string().optional().describe('Optional parent comment ID for replies'),
    }),
    execute: async ({ issueId, content, parentId }) => {
      const comment = await commentService.createComment(issueId, content, userId, parentId)
      return comment
    },
  })
}

export function createUpdateCommentTool({ commentService, userId }: AgentToolsContext) {
  return tool({
    description: 'Update an existing comment. Only the comment creator can update it.',
    inputSchema: z.object({
      commentId: z.string().describe('The ID of the comment to update'),
      content: z.string().min(1).describe('The new comment content'),
    }),
    execute: async ({ commentId, content }) => {
      const comment = await commentService.updateComment(userId, commentId, content)
      return comment
    },
  })
}

export function createDeleteCommentTool({ commentService, userId }: AgentToolsContext) {
  return tool({
    description: 'Delete a comment. Only the comment creator can delete it.',
    inputSchema: z.object({
      commentId: z.string().describe('The ID of the comment to delete'),
    }),
    execute: async ({ commentId }) => {
      await commentService.deleteComment(userId, commentId)
      return {
        success: true,
        commentId,
      }
    },
  })
}

export const commentTools = {
  [GET_COMMENTS_TOOL]: createGetCommentsTool,
  [CREATE_COMMENT_TOOL]: createCreateCommentTool,
  [UPDATE_COMMENT_TOOL]: createUpdateCommentTool,
  [DELETE_COMMENT_TOOL]: createDeleteCommentTool,
}

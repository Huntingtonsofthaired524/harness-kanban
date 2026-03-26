export const ISSUE_EVENTS = {
  ISSUE_CREATED: 'issue.created',
  ISSUE_CREATED_IN_TX: `tx.issue.created`,
  ISSUE_UPDATED: 'issue.updated',
  ISSUE_UPDATED_IN_TX: `tx.issue.updated`,
  ISSUE_DELETED: 'issue.deleted',
  ISSUE_DELETED_IN_TX: `tx.issue.deleted`,
  COMMENT_CREATED: 'comment.created',
  COMMENT_CREATED_IN_TX: `tx.comment.created`,
  ACTIVITY_CREATED: 'activity.created',
  ACTIVITY_CREATED_IN_TX: `tx.activity.created`,
} as const

export type IssueEventNames = (typeof ISSUE_EVENTS)[keyof typeof ISSUE_EVENTS]

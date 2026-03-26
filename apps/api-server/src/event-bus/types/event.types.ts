import { Prisma } from '@repo/database'

export type IssueCreatedEvent = {
  issues: Array<{
    workspaceId: string
    userId: string
    issueId: number
  }>
}

export type IssueUpdatedEvent = {
  workspaceId: string
  userId: string
  issueId: number
  updatedPropertyIds: string[]
  propertyChanges: IssuePropertyChange[]
}

export type IssuePropertyChange = {
  propertyId: string
  previousValue: unknown
  newValue: unknown
}

export type IssueDeletedEvent = {
  workspaceId: string
  userId: string
  issueId: number
  issueTitle: string
  subscriberIds: string[]
}

export type CommentCreatedEvent = {
  workspaceId: string
  userId: string
  issueId: number
  commentId: string
}

export type ActivityCreatedEvent = {
  activities: Array<{
    workspaceId: string
    userId: string
    issueId: number
    activityId: string
  }>
}

export type TxEventWrapper<T> = {
  tx: Prisma.TransactionClient
} & T

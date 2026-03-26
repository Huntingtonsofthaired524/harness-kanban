import { PrismaService } from '@/database/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ActivityType } from '@repo/shared/issue/constants'
import { Activity, ActivityPayload, Comment } from '@repo/shared/issue/types'
import { ActivityQueryResult, CommentActivityDBPayload } from './types/activity.types'
import type { activity as ActivityRecord, comment as CommentRecord } from '@repo/database'

type CommentRecordWithChildren = CommentRecord & { children?: CommentRecord[] }

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivities(
    issueId: number,
    descOrder: boolean = true,
    page?: number,
    pageSize?: number,
  ): Promise<ActivityQueryResult> {
    // Check if the issue exists
    const issueExists = await this.prisma.client.issue
      .count({
        where: {
          id: issueId,
          deleted_at: null,
        },
      })
      .then(Boolean)

    if (!issueExists) {
      throw new NotFoundException(`Issue ${issueId} not found`)
    }

    const where = {
      issue_id: issueId,
    }

    const total = await this.prisma.client.activity.count({
      where,
    })

    const isPaginated = page !== undefined && pageSize !== undefined
    const skip = isPaginated ? (page - 1) * pageSize : undefined
    const take = isPaginated ? pageSize : undefined

    const activityRecords = await this.prisma.client.activity.findMany({
      where,
      orderBy: {
        created_at: descOrder ? 'desc' : 'asc',
      },
      skip,
      take,
    })

    const subscriptions = await this.prisma.client.subscription.findMany({
      where: {
        issue_id: issueId,
        comment_id: null,
      },
    })
    const subscriberIds = subscriptions.map(sub => sub.user_id)

    const commentIds = this.extractCommentIds(activityRecords)
    const commentRecords =
      commentIds.length > 0
        ? await this.prisma.client.comment.findMany({
            where: {
              id: {
                in: commentIds,
              },
              deleted_at: null,
            },
            include: {
              children: {
                where: {
                  deleted_at: null,
                },
                orderBy: {
                  created_at: 'asc',
                },
              },
            },
          })
        : []

    const commentMap = new Map<string, Comment>()
    this.mapCommentsToInterface(commentRecords).forEach(comment => commentMap.set(comment.id, comment))

    // Map database records to Activity interface and include comments where applicable

    const activities = activityRecords
      .map(activity => {
        let payload: ActivityPayload | undefined
        if (activity.type === ActivityType.COMMENT.toString()) {
          const commentId = (activity.payload as CommentActivityDBPayload).commentId
          const comment = commentMap.get(commentId)
          if (comment) {
            payload = comment
          }
        } else {
          payload = activity.payload as ActivityPayload
        }

        // FIXME: Handle other activity types if needed
        const shouldIgnoreActivityPayload = activity.type === ActivityType.COMMENT.toString()
        if (!payload && !shouldIgnoreActivityPayload) {
          throw new Error(
            `Error loading activity payload: ${activity.id}, type: ${activity.type}, data:${JSON.stringify(activity)}`,
          )
        }

        return {
          id: activity.id,
          issueId: activity.issue_id,
          type: activity.type,
          payload,
          createdBy: activity.created_by,
          createdAt: activity.created_at.getTime(),
          updatedAt: activity.updated_at.getTime(),
        }
      })
      .filter(a => a.payload) as Activity[]

    // Calculate total pages if pagination is used
    const totalPages = isPaginated ? Math.ceil(total / pageSize) : undefined

    return {
      total,
      activities,
      page: isPaginated ? page : undefined,
      pageSize: isPaginated ? pageSize : undefined,
      totalPages,
      subscriberIds: subscriberIds,
    }
  }

  async subscribeToIssue(issueId: number, userIds: string[]): Promise<void> {
    await this.prisma.client.subscription.createMany({
      data: userIds.map(userId => ({
        user_id: userId,
        issue_id: issueId,
      })),
      skipDuplicates: true,
    })
  }

  async unsubscribeFromIssue(issueId: number, userIds: string[]): Promise<void> {
    await this.prisma.client.subscription.deleteMany({
      where: {
        issue_id: issueId,
        user_id: {
          in: userIds,
        },
        comment_id: null,
      },
    })
  }

  // === Helper functions ===

  private extractCommentIds(activityRecords: ActivityRecord[]): string[] {
    return activityRecords
      .filter(activity => activity.type === ActivityType.COMMENT.toString())
      .map(activity => {
        const payload = activity.payload as CommentActivityDBPayload
        return payload.commentId
      })
      .filter(Boolean)
  }

  private mapCommentsToInterface(comments: CommentRecordWithChildren[]): Comment[] {
    return comments.map(comment => ({
      id: comment.id,
      issueId: comment.issue_id,
      content: comment.content,
      createdBy: comment.created_by,
      parentId: comment.parent_id,
      createdAt: comment.created_at.getTime(),
      updatedAt: comment.updated_at.getTime(),
      subComments: comment.children ? this.mapCommentsToInterface(comment.children) : [],
    }))
  }
}

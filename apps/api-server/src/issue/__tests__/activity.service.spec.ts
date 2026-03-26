import { PrismaService } from '@/database/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { ActivityType } from '@repo/shared/issue/constants'
import { ActivityService } from '../activity.service'

describe('ActivityService', () => {
  let service: ActivityService
  let prismaService: jest.Mocked<PrismaService>

  beforeEach(() => {
    prismaService = {
      client: {
        issue: {
          count: jest.fn(),
        },
        activity: {
          count: jest.fn(),
          findMany: jest.fn(),
        },
        comment: {
          findMany: jest.fn(),
        },
        subscription: {
          findMany: jest.fn(),
          createMany: jest.fn(),
          deleteMany: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<PrismaService>

    service = new ActivityService(prismaService)

    jest.clearAllMocks()
  })

  describe('getActivities', () => {
    const mockDate = new Date('2024-01-01T00:00:00Z')

    it('should throw NotFoundException when issue does not exist', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(0)

      await expect(service.getActivities(123)).rejects.toThrow(new NotFoundException('Issue 123 not found'))
    })

    it('should return activities without pagination', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(2)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: { propertyId: 'prop-1', newValue: 'value' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
        {
          id: 'activity-2',
          issue_id: 123,
          type: ActivityType.COMMENT,
          payload: { commentId: 'comment-1' },
          created_by: 'user-2',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([
        { user_id: 'user-1', issue_id: 123, comment_id: null },
        { user_id: 'user-2', issue_id: 123, comment_id: null },
      ])
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'comment-1',
          issue_id: 123,
          content: 'Test comment',
          created_by: 'user-2',
          parent_id: null,
          created_at: mockDate,
          updated_at: mockDate,
          children: [],
        },
      ])

      const result = await service.getActivities(123)

      expect(result.total).toBe(2)
      expect(result.activities).toHaveLength(2)
      expect(result.activities[0].type).toBe(ActivityType.SET_PROPERTY_VALUE)
      expect(result.activities[1].type).toBe(ActivityType.COMMENT)
      expect(result.subscriberIds).toEqual(['user-1', 'user-2'])
      expect(result.page).toBeUndefined()
      expect(result.pageSize).toBeUndefined()
      expect(result.totalPages).toBeUndefined()
    })

    it('should return activities with pagination', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(10)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: { propertyId: 'prop-1', newValue: 'value' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue([])

      const result = await service.getActivities(123, true, 1, 5)

      expect(prismaService.client.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
        }),
      )
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(5)
      expect(result.totalPages).toBe(2)
    })

    it('should handle ascending order', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(0)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      await service.getActivities(123, false)

      expect(prismaService.client.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            created_at: 'asc',
          },
        }),
      )
    })

    it('should handle descending order (default)', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(0)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      await service.getActivities(123)

      expect(prismaService.client.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            created_at: 'desc',
          },
        }),
      )
    })

    it('should filter out activities with missing comment payloads', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(2)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.COMMENT,
          payload: { commentId: 'deleted-comment' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
        {
          id: 'activity-2',
          issue_id: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: { propertyId: 'prop-1', newValue: 'value' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue([])

      const result = await service.getActivities(123)

      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].type).toBe(ActivityType.SET_PROPERTY_VALUE)
    })

    it('should throw error when non-comment activity has missing payload', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: null,
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      await expect(service.getActivities(123)).rejects.toThrow('Error loading activity payload: activity-1')
    })

    it('should handle activities without comments when no COMMENT type activities', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: { propertyId: 'prop-1', newValue: 'value' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      const result = await service.getActivities(123)

      expect(prismaService.client.comment.findMany).not.toHaveBeenCalled()
      expect(result.activities).toHaveLength(1)
    })

    it('should map comment activities with comment payload', async () => {
      const commentDate = new Date('2024-01-02T00:00:00Z')
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.COMMENT,
          payload: { commentId: 'comment-1' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'comment-1',
          issue_id: 123,
          content: 'Test comment content',
          created_by: 'user-1',
          parent_id: null,
          created_at: commentDate,
          updated_at: commentDate,
          children: [],
        },
      ])

      const result = await service.getActivities(123)

      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].type).toBe(ActivityType.COMMENT)
      expect(result.activities[0].payload).toEqual({
        id: 'comment-1',
        issueId: 123,
        content: 'Test comment content',
        createdBy: 'user-1',
        parentId: null,
        createdAt: commentDate.getTime(),
        updatedAt: commentDate.getTime(),
        subComments: [],
      })
    })

    it('should handle comments with children (replies)', async () => {
      const childDate = new Date('2024-01-03T00:00:00Z')
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.activity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'activity-1',
          issue_id: 123,
          type: ActivityType.COMMENT,
          payload: { commentId: 'comment-1' },
          created_by: 'user-1',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ])
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'comment-1',
          issue_id: 123,
          content: 'Parent comment',
          created_by: 'user-1',
          parent_id: null,
          created_at: mockDate,
          updated_at: mockDate,
          children: [
            {
              id: 'reply-1',
              issue_id: 123,
              content: 'Reply comment',
              created_by: 'user-2',
              parent_id: 'comment-1',
              created_at: childDate,
              updated_at: childDate,
            },
          ],
        },
      ])

      const result = await service.getActivities(123)

      const commentPayload = result.activities[0].payload as { subComments: unknown[] }
      expect(commentPayload.subComments).toHaveLength(1)
      expect(commentPayload.subComments[0]).toMatchObject({
        id: 'reply-1',
        content: 'Reply comment',
      })
    })
  })

  describe('subscribeToIssue', () => {
    it('should create subscriptions for multiple users', async () => {
      await service.subscribeToIssue(123, ['user-1', 'user-2', 'user-3'])

      expect(prismaService.client.subscription.createMany).toHaveBeenCalledWith({
        data: [
          { user_id: 'user-1', issue_id: 123 },
          { user_id: 'user-2', issue_id: 123 },
          { user_id: 'user-3', issue_id: 123 },
        ],
        skipDuplicates: true,
      })
    })

    it('should handle empty user array', async () => {
      await service.subscribeToIssue(123, [])

      expect(prismaService.client.subscription.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true,
      })
    })
  })

  describe('unsubscribeFromIssue', () => {
    it('should delete subscriptions for multiple users', async () => {
      await service.unsubscribeFromIssue(123, ['user-1', 'user-2'])

      expect(prismaService.client.subscription.deleteMany).toHaveBeenCalledWith({
        where: {
          issue_id: 123,
          user_id: {
            in: ['user-1', 'user-2'],
          },
          comment_id: null,
        },
      })
    })

    it('should handle empty user array', async () => {
      await service.unsubscribeFromIssue(123, [])

      expect(prismaService.client.subscription.deleteMany).toHaveBeenCalledWith({
        where: {
          issue_id: 123,
          user_id: {
            in: [],
          },
          comment_id: null,
        },
      })
    })

    it('should only delete issue subscriptions (comment_id: null)', async () => {
      await service.unsubscribeFromIssue(123, ['user-1'])

      const callArg = (prismaService.client.subscription.deleteMany as jest.Mock).mock.calls[0][0]
      expect(callArg.where.comment_id).toBeNull()
    })
  })
})

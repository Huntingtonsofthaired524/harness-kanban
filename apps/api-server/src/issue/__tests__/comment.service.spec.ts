import { PrismaService } from '@/database/prisma.service'
import { ISSUE_EVENTS } from '@/event-bus/constants/event.constants'
import { emit, emitInTx } from '@/event-bus/event-bus'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ActivityType } from '@repo/shared/issue/constants'
import { CommentService } from '../comment.service'

jest.mock('@/event-bus/event-bus')

describe('CommentService', () => {
  let service: CommentService
  let prismaService: jest.Mocked<PrismaService>
  let eventEmitter: jest.Mocked<EventEmitter2>

  beforeEach(() => {
    prismaService = {
      client: {
        $transaction: jest.fn(),
        issue: {
          findFirst: jest.fn(),
          count: jest.fn(),
        },
        comment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          count: jest.fn(),
        },
        activity: {
          create: jest.fn(),
        },
        subscription: {
          findMany: jest.fn(),
          createMany: jest.fn(),
          deleteMany: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<PrismaService>

    eventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>

    service = new CommentService(prismaService, eventEmitter)

    jest.clearAllMocks()
    ;(emit as jest.Mock).mockClear()
    ;(emitInTx as jest.Mock).mockClear()
  })

  describe('createComment', () => {
    const mockDate = new Date('2024-01-01T00:00:00Z')
    const mockWorkspaceId = 'workspace-123'

    beforeEach(() => {
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date)
      ;(prismaService.client.issue.findFirst as jest.Mock).mockResolvedValue({
        workspace_id: mockWorkspaceId,
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should throw ForbiddenException when issue does not exist', async () => {
      ;(prismaService.client.issue.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.createComment(123, 'content', 'user-1')).rejects.toThrow(
        new ForbiddenException('Issue 123 not found'),
      )
    })

    it('should throw ForbiddenException when parent comment does not exist', async () => {
      ;(prismaService.client.comment.count as jest.Mock).mockResolvedValue(0)

      await expect(service.createComment(123, 'content', 'user-1', 'parent-1')).rejects.toThrow(
        new ForbiddenException('Parent comment with ID parent-1 not found'),
      )
    })

    it('should create top-level comment with activity and subscriptions', async () => {
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test comment',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
      }

      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      const mockTx = {
        comment: {
          create: jest.fn().mockResolvedValue(mockComment),
        },
        activity: {
          create: jest.fn(),
        },
        subscription: {
          createMany: jest.fn(),
        },
      }
      ;(prismaService.client.$transaction as jest.Mock).mockImplementation(async callback => {
        return callback(mockTx)
      })

      const result = await service.createComment(123, 'Test comment', 'user-1')

      expect(mockTx.comment.create).toHaveBeenCalledWith({
        data: {
          issue_id: 123,
          content: 'Test comment',
          created_by: 'user-1',
          parent_id: null,
        },
      })

      expect(mockTx.activity.create).toHaveBeenCalledWith({
        data: {
          issue_id: 123,
          created_by: 'user-1',
          type: ActivityType.COMMENT,
          payload: {
            commentId: 'comment-1',
          },
        },
      })

      expect(mockTx.subscription.createMany).toHaveBeenCalledWith({
        data: [
          { user_id: 'user-1', issue_id: 123, comment_id: null },
          { user_id: 'user-1', issue_id: 123, comment_id: 'comment-1' },
        ],
      })

      expect(emitInTx).toHaveBeenCalledWith(eventEmitter, mockTx, ISSUE_EVENTS.COMMENT_CREATED_IN_TX, {
        workspaceId: mockWorkspaceId,
        userId: 'user-1',
        issueId: 123,
        commentId: 'comment-1',
      })

      expect(emit).toHaveBeenCalledWith(eventEmitter, ISSUE_EVENTS.COMMENT_CREATED, {
        workspaceId: mockWorkspaceId,
        userId: 'user-1',
        issueId: 123,
        commentId: 'comment-1',
      })

      expect(result).toEqual({
        id: 'comment-1',
        issueId: 123,
        content: 'Test comment',
        createdBy: 'user-1',
        parentId: null,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime(),
      })
    })

    it('should create reply comment without activity but with parent subscription', async () => {
      const mockComment = {
        id: 'reply-1',
        issue_id: 123,
        content: 'Reply comment',
        created_by: 'user-1',
        parent_id: 'parent-1',
        created_at: mockDate,
        updated_at: mockDate,
      }

      ;(prismaService.client.comment.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([
        { user_id: 'user-1', issue_id: 123, comment_id: null },
      ])

      const mockTx = {
        comment: {
          create: jest.fn().mockResolvedValue(mockComment),
        },
        activity: {
          create: jest.fn(),
        },
        subscription: {
          createMany: jest.fn(),
        },
      }
      ;(prismaService.client.$transaction as jest.Mock).mockImplementation(async callback => {
        return callback(mockTx)
      })

      const result = await service.createComment(123, 'Reply comment', 'user-1', 'parent-1')

      expect(mockTx.activity.create).not.toHaveBeenCalled()

      expect(mockTx.subscription.createMany).toHaveBeenCalledWith({
        data: [{ user_id: 'user-1', issue_id: 123, comment_id: 'parent-1' }],
      })

      expect(result.parentId).toBe('parent-1')
    })

    it('should not create duplicate issue subscription if user already subscribed to issue', async () => {
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
      }

      // User is already subscribed to the issue
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([
        { user_id: 'user-1', issue_id: 123, comment_id: null },
      ])

      const mockTx = {
        comment: {
          create: jest.fn().mockResolvedValue(mockComment),
        },
        activity: {
          create: jest.fn(),
        },
        subscription: {
          createMany: jest.fn(),
        },
      }
      ;(prismaService.client.$transaction as jest.Mock).mockImplementation(async callback => {
        return callback(mockTx)
      })

      await service.createComment(123, 'Test', 'user-1')

      // Should only create comment subscription, not issue subscription
      expect(mockTx.subscription.createMany).toHaveBeenCalledWith({
        data: [{ user_id: 'user-1', issue_id: 123, comment_id: 'comment-1' }],
      })
    })

    it('should create both subscriptions if user not subscribed to anything', async () => {
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
      }

      // User has no subscriptions
      ;(prismaService.client.subscription.findMany as jest.Mock).mockResolvedValue([])

      const mockTx = {
        comment: {
          create: jest.fn().mockResolvedValue(mockComment),
        },
        activity: {
          create: jest.fn(),
        },
        subscription: {
          createMany: jest.fn(),
        },
      }
      ;(prismaService.client.$transaction as jest.Mock).mockImplementation(async callback => {
        return callback(mockTx)
      })

      await service.createComment(123, 'Test', 'user-1')

      // Should create both issue and comment subscriptions
      expect(mockTx.subscription.createMany).toHaveBeenCalledWith({
        data: [
          { user_id: 'user-1', issue_id: 123, comment_id: null },
          { user_id: 'user-1', issue_id: 123, comment_id: 'comment-1' },
        ],
      })
    })
  })

  describe('queryComments', () => {
    it('should throw ForbiddenException when issue does not exist', async () => {
      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(0)

      await expect(service.queryComments(123)).rejects.toThrow(new ForbiddenException('Issue 123 not found'))
    })

    it('should return comments with children for an issue', async () => {
      const mockDate1 = new Date('2024-01-01')
      const mockDate2 = new Date('2024-01-02')

      const mockComments = [
        {
          id: 'comment-1',
          issue_id: 123,
          content: 'First comment',
          created_by: 'user-1',
          parent_id: null,
          created_at: mockDate1,
          updated_at: mockDate1,
          children: [
            {
              id: 'reply-1',
              issue_id: 123,
              content: 'Reply to first',
              created_by: 'user-2',
              parent_id: 'comment-1',
              created_at: mockDate2,
              updated_at: mockDate2,
            },
          ],
        },
        {
          id: 'comment-2',
          issue_id: 123,
          content: 'Second comment',
          created_by: 'user-2',
          parent_id: null,
          created_at: mockDate2,
          updated_at: mockDate2,
          children: [],
        },
      ]

      ;(prismaService.client.issue.count as jest.Mock).mockResolvedValue(1)
      ;(prismaService.client.comment.findMany as jest.Mock).mockResolvedValue(mockComments)

      const result = await service.queryComments(123)

      expect(prismaService.client.comment.findMany).toHaveBeenCalledWith({
        where: {
          issue_id: 123,
          parent_id: null,
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
        orderBy: {
          created_at: 'asc',
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('comment-1')
      expect(result[0].subComments).toHaveLength(1)
      expect(result[0].subComments![0].id).toBe('reply-1')
      expect(result[1].subComments).toHaveLength(0)
    })
  })

  describe('getCommentById', () => {
    it('should throw NotFoundException when comment does not exist', async () => {
      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.getCommentById('nonexistent')).rejects.toThrow(
        new NotFoundException('Comment nonexistent not found'),
      )
    })

    it('should return comment with children', async () => {
      const mockDate = new Date('2024-01-01')
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test comment',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
        children: [
          {
            id: 'reply-1',
            issue_id: 123,
            content: 'Reply',
            created_by: 'user-2',
            parent_id: 'comment-1',
            created_at: mockDate,
            updated_at: mockDate,
          },
        ],
      }

      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

      const result = await service.getCommentById('comment-1')

      expect(result).toEqual({
        id: 'comment-1',
        issueId: 123,
        content: 'Test comment',
        createdBy: 'user-1',
        parentId: null,
        createdAt: mockDate.getTime(),
        updatedAt: mockDate.getTime(),
        subComments: [
          {
            id: 'reply-1',
            issueId: 123,
            content: 'Reply',
            createdBy: 'user-2',
            parentId: 'comment-1',
            createdAt: mockDate.getTime(),
            updatedAt: mockDate.getTime(),
            subComments: [],
          },
        ],
      })
    })
  })

  describe('updateComment', () => {
    it('should throw NotFoundException when comment does not exist', async () => {
      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.updateComment('user-1', 'nonexistent', 'updated content')).rejects.toThrow(
        new NotFoundException('Comment not found'),
      )
    })

    it('should throw ForbiddenException when user is not the creator', async () => {
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Original',
        created_by: 'user-2',
        parent_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

      await expect(service.updateComment('user-1', 'comment-1', 'updated content')).rejects.toThrow(
        new ForbiddenException('You can only edit your own comments'),
      )
    })

    it('should update comment when user is the creator', async () => {
      const mockDate = new Date('2024-01-01')
      const mockUpdatedDate = new Date('2024-01-02')

      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Original',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
      }

      const mockUpdatedComment = {
        ...mockComment,
        content: 'Updated content',
        updated_at: mockUpdatedDate,
        children: [],
      }

      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
      ;(prismaService.client.comment.update as jest.Mock).mockResolvedValue(mockUpdatedComment)

      jest.spyOn(global, 'Date').mockImplementation(() => mockUpdatedDate as unknown as Date)

      const result = await service.updateComment('user-1', 'comment-1', 'Updated content')

      expect(prismaService.client.comment.update).toHaveBeenCalledWith({
        where: {
          id: 'comment-1',
        },
        data: {
          content: 'Updated content',
          updated_at: mockUpdatedDate,
        },
        include: {
          children: {
            where: { deleted_at: null },
            orderBy: { created_at: 'asc' },
          },
        },
      })

      expect(result.content).toBe('Updated content')
      expect(result.updatedAt).toBe(mockUpdatedDate.getTime())

      jest.restoreAllMocks()
    })
  })

  describe('deleteComment', () => {
    it('should throw NotFoundException when comment does not exist', async () => {
      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.deleteComment('user-1', 'nonexistent')).rejects.toThrow(
        new NotFoundException('Comment not found'),
      )
    })

    it('should throw ForbiddenException when user is not the creator', async () => {
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test',
        created_by: 'user-2',
        parent_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

      await expect(service.deleteComment('user-1', 'comment-1')).rejects.toThrow(
        new ForbiddenException('You can only delete your own comments'),
      )
    })

    it('should soft delete comment and its children', async () => {
      const mockDate = new Date('2024-01-01')
      const mockComment = {
        id: 'comment-1',
        issue_id: 123,
        content: 'Test',
        created_by: 'user-1',
        parent_id: null,
        created_at: mockDate,
        updated_at: mockDate,
      }

      ;(prismaService.client.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

      const mockTx = {
        comment: {
          updateMany: jest.fn(),
          findMany: jest.fn().mockResolvedValue([{ id: 'child-1' }, { id: 'child-2' }]),
        },
        subscription: {
          deleteMany: jest.fn(),
        },
      }
      ;(prismaService.client.$transaction as jest.Mock).mockImplementation(async callback => {
        return callback(mockTx)
      })

      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date)

      await service.deleteComment('user-1', 'comment-1')

      expect(mockTx.comment.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'comment-1' }, { parent_id: 'comment-1' }],
        },
        data: {
          deleted_at: mockDate,
        },
      })

      expect(mockTx.subscription.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { comment_id: 'comment-1' },
            {
              comment_id: {
                in: ['child-1', 'child-2'],
              },
            },
          ],
        },
      })

      jest.restoreAllMocks()
    })
  })
})

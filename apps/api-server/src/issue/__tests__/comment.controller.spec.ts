import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommentController } from '../comment.controller'
import { CommentService } from '../comment.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => undefined,
}))

describe('CommentController', () => {
  let controller: CommentController
  let commentService: jest.Mocked<CommentService>

  beforeEach(() => {
    commentService = {
      queryComments: jest.fn(),
      getCommentById: jest.fn(),
      createComment: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
    } as unknown as jest.Mocked<CommentService>

    controller = new CommentController(commentService)
  })

  it('getIssueComments should return comments from service', async () => {
    const comments = [{ id: 'c1', issueId: 123, content: 'hello' }]
    commentService.queryComments.mockResolvedValue(comments as any)

    const response = await controller.getIssueComments(123)

    expect(commentService.queryComments).toHaveBeenCalledWith(123)
    expect(response.success).toBe(true)
    expect(response.data!.comments).toEqual(comments)
  })

  it('getIssueComment should throw when comment issueId does not match param issue id', async () => {
    commentService.getCommentById.mockResolvedValue({ id: 'c1', issueId: 456 } as any)

    await expect(controller.getIssueComment(123, 'c1')).rejects.toThrow(NotFoundException)
  })

  it('createIssueComment should validate and create comment with session user id', async () => {
    const createdComment = { id: 'c1', issueId: 123, content: 'new comment', createdBy: 'user-1' }
    commentService.createComment.mockResolvedValue(createdComment as any)

    const response = await controller.createIssueComment(123, { content: 'new comment' }, {
      user: { id: 'user-1' },
    } as any)

    expect(commentService.createComment).toHaveBeenCalledWith(123, 'new comment', 'user-1', undefined)
    expect(response.success).toBe(true)
    expect(response.data!.comment).toEqual(createdComment)
  })

  it('createIssueComment should throw BadRequestException for invalid body', async () => {
    await expect(
      controller.createIssueComment(123, { content: '' }, { user: { id: 'user-1' } } as any),
    ).rejects.toThrow(BadRequestException)
  })

  it('updateIssueComment should validate and update comment', async () => {
    const updatedComment = { id: 'c1', issueId: 123, content: 'updated comment', createdBy: 'user-1' }
    commentService.updateComment.mockResolvedValue(updatedComment as any)

    const response = await controller.updateIssueComment(123, 'c1', { content: 'updated comment' }, {
      user: { id: 'user-1' },
    } as any)

    expect(commentService.updateComment).toHaveBeenCalledWith('user-1', 'c1', 'updated comment')
    expect(response.success).toBe(true)
    expect(response.data!.comment).toEqual(updatedComment)
  })

  it('deleteIssueComment should delete and return success', async () => {
    commentService.deleteComment.mockResolvedValue(undefined)

    const response = await controller.deleteIssueComment(123, 'c1', { user: { id: 'user-1' } } as any)

    expect(commentService.deleteComment).toHaveBeenCalledWith('user-1', 'c1')
    expect(response.success).toBe(true)
    expect(response.data).toEqual({ success: true })
  })
})

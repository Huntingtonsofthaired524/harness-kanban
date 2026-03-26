import { z } from 'zod'

import { ApiResponse as BaseApiResponse, makeSuccessResponse } from '@/common/responses/api-response'
import { zodParse } from '@/common/zod/zod-parse'
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common'
import { Comment } from '@repo/shared/issue/types'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { CommentService } from './comment.service'
import { CreateCommentResponseDto, GetCommentResponseDto, GetCommentsResponseDto } from './types/comment.types'

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  parentId: z.string().optional(),
})

const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
})

@Controller('api/v1/issues')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':id/comments')
  async getIssueComments(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<GetCommentsResponseDto>> {
    const comments = await this.commentService.queryComments(id)
    return makeSuccessResponse({ comments })
  }

  @Get(':id/comments/:commentId')
  async getIssueComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId') commentId: string,
  ): Promise<BaseApiResponse<GetCommentResponseDto>> {
    const comment = await this.commentService.getCommentById(commentId)
    if (comment.issueId !== id) {
      throw new NotFoundException('Comment not found')
    }
    return makeSuccessResponse({ comment })
  }

  @Post(':id/comments')
  async createIssueComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() createCommentDtoRaw: unknown,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<CreateCommentResponseDto>> {
    const createCommentDto = zodParse(CreateCommentSchema, createCommentDtoRaw)
    const comment = await this.commentService.createComment(
      id,
      createCommentDto.content,
      session.user.id,
      createCommentDto.parentId,
    )
    return makeSuccessResponse({ comment })
  }

  @Patch(':id/comments/:commentId')
  async updateIssueComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId') commentId: string,
    @Body() updateCommentDtoRaw: unknown,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<{ comment: Comment }>> {
    const updateCommentDto = zodParse(UpdateCommentSchema, updateCommentDtoRaw)
    const comment = await this.commentService.updateComment(session.user.id, commentId, updateCommentDto.content)
    return makeSuccessResponse({ comment })
  }

  @Delete(':id/comments/:commentId')
  async deleteIssueComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId') commentId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<{ success: boolean }>> {
    await this.commentService.deleteComment(session.user.id, commentId)
    return makeSuccessResponse({ success: true })
  }
}

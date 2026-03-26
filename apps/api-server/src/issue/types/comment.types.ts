import { Comment } from '@repo/shared/issue/types'

export interface CreateCommentResponseDto {
  comment: Comment
}

export interface GetCommentResponseDto {
  comment: Comment
}

export interface GetCommentsResponseDto {
  comments: Comment[]
}

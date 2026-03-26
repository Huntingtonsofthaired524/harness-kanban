import { CommentContent } from './types'

export const parseCommentContent = (content: string): CommentContent => {
  try {
    const parsed = JSON.parse(content)

    if (!parsed.attr) {
      return { ...parsed, attr: { data: {} } }
    }

    return parsed
  } catch {
    return { type: 'doc', content: [], attr: { data: {} } }
  }
}

export const stringifyCommentContent = (content: CommentContent): string => {
  return JSON.stringify(content)
}

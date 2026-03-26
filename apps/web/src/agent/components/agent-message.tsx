'use client'

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { cn } from '@/lib/shadcn/utils'
import { renderToolPart } from './tool-renderers/tool-registry'
import type { UIMessage } from '@ai-sdk/react'
import type { AgentMessageProps } from './types'

/**
 * Check if a message part is a tool part
 */
function isToolPart(
  part: UIMessage['parts'][number],
): part is Extract<UIMessage['parts'][number], { type: `tool-${string}` }> {
  return part.type.startsWith('tool-')
}

/**
 * Render a single message part
 */
function renderPart(part: UIMessage['parts'][number], index: number) {
  // Text part
  if (part.type === 'text') {
    return (
      <MessageResponse key={index} className="text-sm leading-relaxed">
        {part.text}
      </MessageResponse>
    )
  }

  // Tool part
  if (isToolPart(part)) {
    return <div key={index}>{renderToolPart(part)}</div>
  }

  // Unknown part type - skip
  return null
}

export function AgentMessage({ message, className }: AgentMessageProps) {
  const isUser = message.role === 'user'

  // Extract text content from message parts for user messages
  const textContent = message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('')

  return (
    <Message from={message.role} className={cn('w-full', className)}>
      <MessageContent>
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{textContent}</div>
        ) : (
          <div className="space-y-2">{message.parts.map((part, index) => renderPart(part, index))}</div>
        )}
      </MessageContent>
    </Message>
  )
}

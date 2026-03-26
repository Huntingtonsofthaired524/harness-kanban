'use client'

import { ArrowDownIcon, DownloadIcon } from 'lucide-react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/shadcn/utils'
import type { ComponentProps, ReactNode } from 'react'
import type { StickToBottomContext } from 'use-stick-to-bottom'

// Re-export the context type for consumers
export type { StickToBottomContext }

export type ConversationProps = Omit<ComponentProps<typeof StickToBottom>, 'children' | 'className'> & {
  className?: string
  children?: ReactNode | ((context: StickToBottomContext) => ReactNode)
}

export const Conversation = ({ className, children, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-hidden', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}>
    {children}
  </StickToBottom>
)

export type ConversationContentProps = Omit<ComponentProps<typeof StickToBottom.Content>, 'children' | 'className'> & {
  className?: string
  children?: ReactNode | ((context: StickToBottomContext) => ReactNode)
}

export const ConversationContent = ({ className, children, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn('flex flex-col gap-8 p-4', className)} {...props}>
    {children}
  </StickToBottom.Content>
)

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export const ConversationEmptyState = ({
  className,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn('flex size-full flex-col items-center justify-center gap-3 p-8 text-center', className)}
    {...props}>
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </>
    )}
  </div>
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const ConversationScrollButton = ({ className, ...props }: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  if (isAtBottom) {
    return null
  }

  return (
    <Button
      className={cn(
        'dark:bg-background dark:hover:bg-muted absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
        className,
      )}
      onClick={handleScrollToBottom}
      size="icon"
      type="button"
      variant="outline"
      {...props}>
      <ArrowDownIcon className="size-4" />
    </Button>
  )
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'data' | 'tool'
  content: string
}

export type ConversationDownloadProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  messages: ConversationMessage[]
  filename?: string
  formatMessage?: (message: ConversationMessage, index: number) => string
}

const defaultFormatMessage = (message: ConversationMessage): string => {
  const roleLabel = message.role.charAt(0).toUpperCase() + message.role.slice(1)
  return `**${roleLabel}:** ${message.content}`
}

export const messagesToMarkdown = (
  messages: ConversationMessage[],
  formatMessage: (message: ConversationMessage, index: number) => string = defaultFormatMessage,
): string => messages.map((msg, i) => formatMessage(msg, i)).join('\n\n')

export const ConversationDownload = ({
  messages,
  filename = 'conversation.md',
  formatMessage = defaultFormatMessage,
  className,
  children,
  ...props
}: ConversationDownloadProps) => {
  const handleDownload = useCallback(() => {
    const markdown = messagesToMarkdown(messages, formatMessage)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [messages, filename, formatMessage])

  return (
    <Button
      className={cn('dark:bg-background dark:hover:bg-muted absolute right-4 top-4 rounded-full', className)}
      onClick={handleDownload}
      size="icon"
      type="button"
      variant="outline"
      {...props}>
      {children ?? <DownloadIcon className="size-4" />}
    </Button>
  )
}

'use client'

import { Loader2Icon } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/shadcn/utils'
import { isValidToolName } from '@repo/shared'
import { TOOL_TERMINAL_PART_STATES, useToolApproval } from '../tool-approval-context'
import { FallbackTool } from './fallback-tool'
import {
  AddMultipleTodosTool,
  AddSubscriberTool,
  CreateCommentTool,
  CreateIssueTool,
  DeleteCommentTool,
  DeleteIssueTool,
  DeleteMultipleTodosTool,
  GetAvailableUsersTool,
  GetCommentsTool,
  GetCurrentUserTool,
  GetIssueByIdTool,
  GetIssuesTool,
  GetSubscribersTool,
  ListTodosTool,
  QueryPropertiesTool,
  RemoveSubscriberTool,
  SemanticSearchIssuesTool,
  ToggleMultipleTodosTool,
  UpdateCommentTool,
  UpdateIssueTool,
} from './tool-components'
import type { ToolName } from '@repo/shared'
import type { ToolUIPart } from 'ai'
import type { JSX, ReactNode } from 'react'

// Re-export ToolName type from shared package
export type { ToolName } from '@repo/shared'

// Extract tool name from ToolUIPart type (e.g., "tool-queryProperties" -> "queryProperties")
export type ExtractToolName<T> = T extends `tool-${infer Name}` ? Name : never

// Tool renderer component type
export type ToolRendererProps = {
  part: ToolUIPart
}

export type ToolRenderer = (props: ToolRendererProps) => JSX.Element

// Registry mapping tool names to their renderers
const toolRegistry: Record<ToolName, ToolRenderer> = {
  queryProperties: QueryPropertiesTool,
  createIssue: CreateIssueTool,
  getIssues: GetIssuesTool,
  semanticSearchIssues: SemanticSearchIssuesTool,
  getIssueById: GetIssueByIdTool,
  updateIssue: UpdateIssueTool,
  deleteIssue: DeleteIssueTool,
  getComments: GetCommentsTool,
  createComment: CreateCommentTool,
  updateComment: UpdateCommentTool,
  deleteComment: DeleteCommentTool,
  getSubscribers: GetSubscribersTool,
  addSubscriber: AddSubscriberTool,
  removeSubscriber: RemoveSubscriberTool,
  getAvailableUsers: GetAvailableUsersTool,
  getCurrentUser: GetCurrentUserTool,
  listTodos: ListTodosTool,
  addMultipleTodos: AddMultipleTodosTool,
  toggleMultipleTodos: ToggleMultipleTodosTool,
  deleteMultipleTodos: DeleteMultipleTodosTool,
}

/**
 * Get the tool name from a ToolUIPart type
 * e.g., "tool-queryProperties" -> "queryProperties"
 */
export function getToolNameFromType(type: string): string | null {
  if (type.startsWith('tool-')) {
    return type.slice(5)
  }
  return null
}

/**
 * Check if a tool renderer is registered for the given tool name
 */
export function hasToolRenderer(toolName: string): toolName is ToolName {
  return isValidToolName(toolName)
}

/**
 * Get the renderer for a specific tool name
 */
export function getToolRenderer(toolName: ToolName): ToolRenderer | undefined {
  return toolRegistry[toolName]
}

/**
 * Register a custom tool renderer
 * This allows extending or overriding tool renderers at runtime
 */
export function registerToolRenderer(toolName: ToolName, renderer: ToolRenderer): void {
  toolRegistry[toolName] = renderer
}

function ToolRendererWithApproval({ part }: { part: ToolUIPart }): JSX.Element {
  const { approvalStates, respondToolCall } = useToolApproval()
  const toolName = getToolNameFromType(part.type)
  const [rejectReason, setRejectReason] = React.useState('')
  const [decision, setDecision] = React.useState<'approve' | 'reject'>('approve')

  let renderedTool: JSX.Element
  if (toolName && hasToolRenderer(toolName)) {
    const Renderer = getToolRenderer(toolName)
    renderedTool = Renderer ? <Renderer part={part} /> : <FallbackTool part={part} />
  } else {
    renderedTool = <FallbackTool part={part} />
  }

  if (TOOL_TERMINAL_PART_STATES.includes(part.state as (typeof TOOL_TERMINAL_PART_STATES)[number])) {
    return renderedTool
  }

  const approvalState = approvalStates[part.toolCallId]
  if (!approvalState || approvalState === 'responded') {
    return renderedTool
  }

  const isResponding = approvalState === 'responding'
  const isRejectSelected = decision === 'reject'

  return (
    <div className="space-y-2">
      {renderedTool}
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
        <div className="text-sm font-medium text-amber-900">Do you want to approve this action?</div>
        <RadioGroup
          defaultValue="approve"
          value={decision}
          onValueChange={value => setDecision(value as 'approve' | 'reject')}
          className="mt-3 gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="approve" id={`${part.toolCallId}-approve`} disabled={isResponding} />
            <label
              htmlFor={`${part.toolCallId}-approve`}
              className={cn(
                'text-sm',
                decision !== 'approve' ? 'text-muted-foreground' : 'text-foreground font-medium',
                isResponding ? 'cursor-not-allowed' : 'cursor-pointer',
              )}>
              Yes, allow this action
            </label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="reject" id={`${part.toolCallId}-reject`} disabled={isResponding} />
            <label
              htmlFor={`${part.toolCallId}-reject`}
              className={cn(
                'text-sm',
                decision !== 'reject' ? 'text-muted-foreground' : 'text-foreground font-medium',
                isResponding ? 'cursor-not-allowed' : 'cursor-pointer',
              )}>
              No, reject this action
            </label>
          </div>
        </RadioGroup>
        <Textarea
          className="mt-3 min-h-20 resize-none bg-white placeholder:text-xs placeholder:text-gray-400"
          value={rejectReason}
          onChange={event => setRejectReason(event.target.value)}
          placeholder="Tell the AI what to do instead..."
          disabled={isResponding || !isRejectSelected}
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              if (decision === 'approve') {
                void respondToolCall(part.toolCallId, true)
                return
              }

              if (decision === 'reject') {
                void respondToolCall(part.toolCallId, false, rejectReason.trim() || undefined)
              }
            }}
            disabled={isResponding}>
            {isResponding ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Render a tool part using the appropriate renderer
 * Falls back to FallbackTool if no specific renderer is found
 */
export function renderToolPart(part: ToolUIPart): ReactNode {
  return <ToolRendererWithApproval part={part} />
}

// Re-export all tool components for direct usage
export * from './tool-components'
export { FallbackTool } from './fallback-tool'
export type { ToolComponentProps } from './tool-components'

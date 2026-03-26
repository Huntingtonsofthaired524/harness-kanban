'use client'

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import type { ToolUIPart } from 'ai'
import type { JSX } from 'react'

export type FallbackToolProps = {
  part: ToolUIPart
}

/**
 * Fallback tool renderer for any tool that doesn't have a specific renderer.
 * Uses the standard Tool component with generic display.
 */
export function FallbackTool({ part }: FallbackToolProps): JSX.Element {
  return (
    <Tool defaultOpen={part.state === 'output-available' || part.state === 'output-error'}>
      <ToolHeader type={part.type} state={part.state} />
      <ToolContent>
        {'input' in part && part.input ? <ToolInput input={part.input as Record<string, unknown>} /> : null}
        {'output' in part || 'errorText' in part ? (
          <ToolOutput
            output={'output' in part ? (part.output as Record<string, unknown>) : undefined}
            errorText={'errorText' in part ? part.errorText : undefined}
          />
        ) : null}
      </ToolContent>
    </Tool>
  )
}

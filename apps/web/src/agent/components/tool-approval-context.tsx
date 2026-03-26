'use client'

import React, { createContext, useContext } from 'react'

import type { ReactNode } from 'react'

export const TOOL_APPROVAL_STATES = ['approval-requested', 'responding', 'responded'] as const
export type ToolApprovalState = (typeof TOOL_APPROVAL_STATES)[number]

export const TOOL_TERMINAL_PART_STATES = ['output-available', 'output-error', 'output-denied'] as const

interface ToolApprovalContextValue {
  approvalStates: Record<string, ToolApprovalState>
  respondToolCall: (toolCallId: string, approved: boolean, reason?: string) => Promise<void>
}

const defaultContextValue: ToolApprovalContextValue = {
  approvalStates: {},
  respondToolCall: async () => {},
}

const ToolApprovalContext = createContext<ToolApprovalContextValue>(defaultContextValue)

interface ToolApprovalProviderProps {
  value: ToolApprovalContextValue
  children: ReactNode
}

export function ToolApprovalProvider({ value, children }: ToolApprovalProviderProps) {
  return <ToolApprovalContext.Provider value={value}>{children}</ToolApprovalContext.Provider>
}

export function useToolApproval(): ToolApprovalContextValue {
  return useContext(ToolApprovalContext)
}

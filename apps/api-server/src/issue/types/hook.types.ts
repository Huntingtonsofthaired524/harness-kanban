import { CreateIssueInput } from '@/issue/types/issue.types'
import { ValidationResult } from '@/property/types/property.types'
import { Operation, PropertyDefinition } from '@repo/shared/property/types'

export interface PreCreateIssueHookContext {
  workspaceId: string
  userId: string
  propertyMap: PropertyDefinition[]
  propertyValues: CreateIssueInput['propertyValues']
  getRequestedValue(propertyId: string): unknown
}

export interface PreUpdateIssueHookContext {
  workspaceId: string
  userId: string
  issueId: number
  issue: {
    id: number
    workspace_id: string | null
  }
  operations: Operation[]
  propertyMap: PropertyDefinition[]
  originalPropertyValues: Map<string, null | string | number | Array<string> | Array<number>>
  getCurrentValue(propertyId: string): null | string | number | Array<string> | Array<number>
  getOperation(propertyId: string): Operation | undefined
  getNextSetValue(propertyId: string): unknown
}

export interface PreCreateIssueHook {
  execute(context: PreCreateIssueHookContext): Promise<ValidationResult>
}

export interface PreUpdateIssueHook {
  execute(context: PreUpdateIssueHookContext): Promise<ValidationResult>
}

import { Operation, PropertyValue } from '@repo/shared/property/types'

export interface BaseContext {
  workspaceId: string
  userId: string
}

export interface Issue {
  issueId: number
  propertyValues: PropertyValue[]
}

export interface UpdateIssueInput {
  issueId: number
  operations: Operation[]
}

export interface CreateIssueInput {
  propertyValues: {
    propertyId: string
    value: unknown
  }[]
}

export interface UpdateIssueResult {
  success: boolean
  issueId?: number
  errors?: string[]
}

export interface GetIssuesResponseDto {
  issues: Issue[]
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export interface CreateIssueDto {
  issue: {
    propertyValues: PropertyValue[]
  }
}

export interface CreateIssueResponseDto {
  issueId: number
}

export interface CreateIssuesDto {
  issues: {
    propertyValues: PropertyValue[]
  }[]
}

export interface CreateIssuesResponseDto {
  results: {
    issueId: number
    success: boolean
    errors?: string[]
  }[]
}

export interface GetIssueResponseDto {
  issue: Issue
}

export interface DeleteIssueResponseDto {
  success: boolean
  message?: string
}

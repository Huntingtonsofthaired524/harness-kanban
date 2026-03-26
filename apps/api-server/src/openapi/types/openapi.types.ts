export interface CreateApiKeyRequest {
  name?: string
}

export interface CreateApiKeyResponse {
  apiKey: string
}

export interface FieldFilterCondition {
  field: string // property alias
  fieldType: string
  operator: string
  operand?: unknown
}

export interface FieldSortConfig {
  field: string // property alias
  desc: boolean
}

export interface FieldValue {
  field: string // property alias
  value: unknown
}

interface FieldCreateIssueInput {
  fieldValues: FieldValue[]
}

export interface CreateIssueRequest {
  workspaceId: string
  issue: FieldCreateIssueInput
}

export interface FieldOperation {
  field: string // property alias
  operationType: string
  operationPayload: Record<string, unknown>
}

export interface FieldUpdateIssueRequest {
  workspaceId: string
  operations: FieldOperation[]
}

export interface GetIssuesResponse {
  issues: Array<{
    issueId: number
    fieldValues: FieldValue[]
  }>
  total: number
}

export interface CreateIssueResponse {
  issueId: number
}

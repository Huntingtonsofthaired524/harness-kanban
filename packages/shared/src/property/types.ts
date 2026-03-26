import { FilterOperator } from './constants'

export interface PropertyDefinition {
  id: string
  name: string
  description?: string
  type: string
  config?: Record<string, unknown>
  readonly: boolean
  deletable: boolean
}

export interface FilterCondition {
  propertyId: string
  propertyType: string
  operator: FilterOperator
  operand: unknown | undefined
}

export interface PropertyValue {
  propertyId: string
  value: unknown
}

export interface Issue {
  issueId: number
  propertyValues: PropertyValue[]
}

export interface Operation {
  propertyId: string
  operationType: string
  operationPayload: Record<string, unknown>
}

export type CommonSetOperationPayload = {
  value: unknown
}

export type StatusDefinition = {
  id: string
  label: string
  icon: string
}

export type StatusTransition = {
  toStatusId: string
  actionLabel: string
}

export type StatusTransitionMap = Record<string, StatusTransition[]>

export type StatusPropertyConfig = {
  initialStatusId: string
  statuses: StatusDefinition[]
  transitions: StatusTransitionMap
}

export type ResolvedStatusAction = StatusTransition & StatusDefinition

export type ResolveStatusActionsInput = {
  issueId?: number
  currentStatusId?: string
}

export type ResolveStatusActionsResult = {
  currentStatusId: string
  actions: ResolvedStatusAction[]
}

export interface SortParam {
  id: string
  desc: boolean
}

export type NumberTypePropertyConfig = {
  min?: number
  max?: number
  precision?: number
}

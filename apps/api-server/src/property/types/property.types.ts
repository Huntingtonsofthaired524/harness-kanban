import { ConstructActivityParams } from '@/issue/types/activity.types'
import { BaseContext } from '@/issue/types/issue.types'
import { Prisma } from '@repo/database'
import { PropertyDefinition } from '@repo/shared/property/types'

export type PropertySingleValue = {
  issue_id: number
  property_id: string
  property_type: string
  value: string | null
  number_value: number | null
  extra?: Prisma.JsonValue
}

export type PropertyMultiValue = {
  issue_id: number
  property_id: string
  property_type: string
  value: string | null
  number_value: number | null
  position: number
  extra?: Prisma.JsonValue
}

export interface PropertyValueResolver {
  resolve(
    issueId: number,
    propertyId: string,
    propertyValue: unknown,
    issueMultiValues: PropertyMultiValue[],
    issueSingleValues: PropertySingleValue[],
  ): Promise<unknown>
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export interface DbInsertData {
  singleValues?: Omit<Prisma.property_single_valueCreateManyInput, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[]
  multiValues?: Omit<Prisma.property_multi_valueCreateManyInput, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[]
}

export interface CreationPropertyProcessor {
  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult

  validateBusinessRules(context: BaseContext, property: PropertyDefinition, value: unknown): Promise<ValidationResult>

  transformToDbFormat(
    context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
    issueId: number,
  ): Promise<DbInsertData>
}

export interface UpdatePropertyProcessor {
  validateFormat(
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult

  valueChanged(
    originalValue: null | string | number | Array<string> | Array<number>,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): boolean

  validateBusinessRules(
    context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    issueId?: number,
  ): Promise<ValidationResult>

  transformToDbOperations(
    context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    issueId: number,
  ): Promise<DbUpdateOperationResult>

  generateActivity(
    context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    issueId: number,
  ): ConstructActivityParams[]
}

export interface DbUpdateOperationResult {
  singleValueClear?: boolean
  singleValueUpdate?: SingleValueUpdateData
  multiValueClear?: boolean
  multiValueRemovePositions?: number[]
  multiValueUpdates?: Map<number, Omit<MultiValueUpdateData, 'position'>>
  multiValueCreates?: MultiValueUpdateData[]
}

export interface SingleValueUpdateData {
  value?: string | null
  number_value?: number | null
}

export interface MultiValueUpdateData {
  value?: string | null
  number_value?: number | null
  extra?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue
  position: number
}

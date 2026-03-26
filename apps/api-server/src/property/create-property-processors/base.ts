import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@repo/database'
import { PropertyDefinition } from '@repo/shared/property/types'
import { CreationPropertyProcessor, DbInsertData, ValidationResult } from '../types/property.types'

@Injectable()
export abstract class BasePropertyProcessor implements CreationPropertyProcessor {
  abstract validateFormat(property: PropertyDefinition, value: unknown): ValidationResult

  abstract validateBusinessRules(
    context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult>

  abstract transformToDbFormat(
    _context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
    issueId: number,
  ): Promise<DbInsertData>

  protected createSingleValue(
    issueId: number,
    propertyId: string,
    propertyType: string,
    value: string | null,
    numberValue?: number | null,
  ): Omit<Prisma.property_single_valueCreateManyInput, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {
    return {
      issue_id: issueId,
      property_id: propertyId,
      property_type: propertyType,
      value,
      number_value: numberValue,
    }
  }

  protected createMultiValue(
    issueId: number,
    propertyId: string,
    propertyType: string,
    position: number,
    value?: string | null,
    numberValue?: number | null,
    extra?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue,
  ): Omit<Prisma.property_multi_valueCreateManyInput, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {
    return {
      issue_id: issueId,
      property_id: propertyId,
      property_type: propertyType,
      value,
      position,
      number_value: numberValue,
      extra: extra,
    }
  }
}

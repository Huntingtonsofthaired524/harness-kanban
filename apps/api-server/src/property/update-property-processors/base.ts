import { ConstructActivityParams } from '@/issue/types/activity.types'
import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { ActivityType } from '@repo/shared/issue/constants'
import { ClearPropertyValueActivityPayload, SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { CommonSetOperationPayload, PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, UpdatePropertyProcessor, ValidationResult } from '../types/property.types'

@Injectable()
export abstract class BaseUpdatePropertyProcessor implements UpdatePropertyProcessor {
  // a default implementation, should work for most properties. implement custom diff logic in sub classes if needed.
  valueChanged(
    originalValue: null | string | number | Array<string> | Array<number>,
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): boolean {
    if (operationType === CommonPropertyOperationType.CLEAR.toString()) {
      return originalValue !== null
    }
    if (operationType === CommonPropertyOperationType.SET.toString()) {
      if ('value' in payload) {
        const { value } = payload as CommonSetOperationPayload
        if (originalValue === null || value === null) {
          // check if only one of them is null, meaning value changed
          return (originalValue === null) !== (value === null)
        }
        if (typeof originalValue === typeof value) {
          if (Array.isArray(originalValue) && Array.isArray(value)) {
            return originalValue.length !== value.length || !originalValue.every((v, i) => v === value[i])
          }
          return originalValue !== value
        }
        return true
      } else {
        throw new Error(
          'Unexpected common operation payload. Please implement the corresponding diff logic in sub classes.',
        )
      }
    }
    throw new Error('Unexpected common operation type. Please implement the corresponding diff logic in sub classes.')
  }

  abstract validateFormat(
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult

  abstract validateBusinessRules(
    context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    // reivew: 没有特殊原因的话，就设置为非空
    issueId?: number,
  ): Promise<ValidationResult>

  abstract transformToDbOperations(
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
  ): ConstructActivityParams[] {
    switch (operationType) {
      case CommonPropertyOperationType.SET.toString(): {
        const activityPayload: SetPropertyValueActivityPayload = {
          userId: context.userId,
          propertyId: property.id,
          propertyType: property.type as PropertyType,
          propertyName: property.name,
          newValue: payload.value,
        }
        return [
          {
            issueId: issueId,
            type: ActivityType.SET_PROPERTY_VALUE,
            payload: activityPayload,
            createdBy: context.userId,
          },
        ]
      }
      case CommonPropertyOperationType.CLEAR.toString(): {
        const activityPayload: ClearPropertyValueActivityPayload = {
          userId: context.userId,
          propertyId: property.id,
          propertyType: property.type as PropertyType,
          propertyName: property.name,
        }
        return [
          {
            issueId: issueId,
            type: ActivityType.CLEAR_PROPERTY_VALUE,
            payload: activityPayload,
            createdBy: context.userId,
          },
        ]
      }
      default:
        return []
    }
  }
}

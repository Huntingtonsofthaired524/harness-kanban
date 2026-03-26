import z from 'zod'

import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { checkPrecision } from '@repo/shared/lib/utils/number'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { NumberTypePropertyConfig, PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'
import { isCommonSetValueOpration, isRemoveOperation } from './common'

@Injectable()
export class NumberUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  validateFormat(
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult {
    if (!isCommonSetValueOpration(operationType, payload, z.number()) && !isRemoveOperation(operationType)) {
      return {
        valid: false,
        errors: [`Invalid operation type or value format`],
      }
    }
    return { valid: true }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validateBusinessRules(
    _context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    _issueId?: number,
  ): Promise<ValidationResult> {
    if (operationType !== CommonPropertyOperationType.SET.toString()) {
      return { valid: true }
    }
    const numberValue = payload.value as number
    const config = property.config as NumberTypePropertyConfig | undefined

    if (config?.min !== undefined && numberValue < config.min) {
      return {
        valid: false,
        errors: [`The value must be greater than ${config.min}`],
      }
    }
    if (config?.max !== undefined && numberValue > config.max) {
      return {
        valid: false,
        errors: [`The value must be less than ${config.max}`],
      }
    }
    if (config?.precision !== undefined) {
      if (!checkPrecision(numberValue, config.precision)) {
        return {
          valid: false,
          errors: [`The precision must be ${config.precision} decimal places`],
        }
      }
    }
    return { valid: true }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async transformToDbOperations(
    _context: BaseContext,
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    _issueId: number,
  ): Promise<DbUpdateOperationResult> {
    if (operationType === CommonPropertyOperationType.CLEAR.toString()) {
      return {
        singleValueClear: true,
      }
    }
    const value = payload.value as number
    return {
      singleValueUpdate: {
        number_value: value,
      },
    }
  }
}

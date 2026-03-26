import z from 'zod'

import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { checkTimestampPrecision } from '@repo/shared/lib/utils/datetime'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'
import { isCommonSetValueOpration, isRemoveOperation } from './common'

@Injectable()
export class DatetimeUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
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
    if (operationType === CommonPropertyOperationType.SET.toString()) {
      const value = payload.value as number
      if (!checkTimestampPrecision(value, 'millisecond')) {
        return { valid: false, errors: ['Datetime must be milliseconds precision (13 digits)'] }
      }
    }
    return { valid: true }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validateBusinessRules(
    _context: BaseContext,
    _property: PropertyDefinition,
    _operationType: string,
    _payload: Record<string, unknown>,
    _issueId?: number,
  ): Promise<ValidationResult> {
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
    const timestamp = payload.value as number
    const isoString = new Date(timestamp).toISOString()
    const result = {
      singleValueUpdate: {
        value: isoString,
        number_value: timestamp,
      },
    }
    return result
  }
}

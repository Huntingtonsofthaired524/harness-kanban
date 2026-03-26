import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'

@Injectable()
export class TitleUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  validateFormat(
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult {
    if (operationType !== CommonPropertyOperationType.SET.toString()) {
      return {
        valid: false,
        errors: [`Title property does not support operation type: ${operationType}`],
      }
    }
    if (!('value' in payload) || typeof payload.value !== 'string') {
      return {
        valid: false,
        errors: ['SET operation requires a string value'],
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
    _operationType: string,
    payload: Record<string, unknown>,
    _issueId: number,
  ): Promise<DbUpdateOperationResult> {
    const result: DbUpdateOperationResult = {
      singleValueUpdate: {
        value: payload.value as string,
        number_value: null,
      },
    }
    return result
  }
}

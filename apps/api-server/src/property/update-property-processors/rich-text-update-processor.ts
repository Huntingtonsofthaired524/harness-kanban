import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'

@Injectable()
export class RichTextUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  validateFormat(
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult {
    if (
      operationType !== CommonPropertyOperationType.SET.toString() &&
      operationType !== CommonPropertyOperationType.CLEAR.toString()
    ) {
      return {
        valid: false,
        errors: [
          `Rich text property does not support operation type: ${operationType}, only ${CommonPropertyOperationType.SET} and ${CommonPropertyOperationType.CLEAR} are supported`,
        ],
      }
    }
    if (operationType === CommonPropertyOperationType.SET.toString()) {
      if (!('value' in payload)) {
        return {
          valid: false,
          errors: ['SET operation requires a value field'],
        }
      }
      const value = payload.value
      if (value !== null && typeof value !== 'string') {
        return {
          valid: false,
          errors: ['Rich text property value must be a string or null'],
        }
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
    const result: DbUpdateOperationResult = {}
    switch (operationType) {
      case CommonPropertyOperationType.SET.toString():
        result.singleValueUpdate = {
          value: payload.value as string | null,
          number_value: null,
        }
        break
      case CommonPropertyOperationType.CLEAR.toString():
        result.singleValueClear = true
        break
    }
    return result
  }
}

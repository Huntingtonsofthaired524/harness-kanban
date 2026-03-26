import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'

@Injectable()
export class SelectUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  validateFormat(
    property: PropertyDefinition,
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
          `Select property does not support operation type: ${operationType}, only ${CommonPropertyOperationType.SET} and ${CommonPropertyOperationType.CLEAR} are supported`,
        ],
      }
    }
    // SET operation needs to verify payload
    if (operationType === CommonPropertyOperationType.SET.toString()) {
      if (!('value' in payload)) {
        return {
          valid: false,
          errors: ['SET operation requires a value field'],
        }
      }
      // Select type value must be a string or null
      const value = payload.value
      if (value !== null && typeof value !== 'string') {
        return {
          valid: false,
          errors: ['Select type value must be a string or null'],
        }
      }
    }
    // Format validation passed
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
    // Only verify SET operation
    if (operationType === CommonPropertyOperationType.SET.toString() && payload.value !== null) {
      const value = payload.value as string
      const config = property.config as Record<string, unknown> | null

      // The config must have an options field and be an array
      if (!config || !Array.isArray(config.options)) {
        return {
          valid: false,
          errors: ['Property config is missing options array'],
        }
      }
      // The selected value must be in the option list
      const options = config.options as Array<{
        id: string
        name: string
        color: string
      }>
      const validValues = options.map(option => option.id)

      if (!validValues.includes(value)) {
        return {
          valid: false,
          errors: [`The selected value "${value}" is not in the option list`],
        }
      }
    }

    // Business rules validation passed
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

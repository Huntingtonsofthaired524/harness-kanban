import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

interface NumberTypePropertyConfig {
  min?: number
  max?: number
  precision?: number
}

// Utility function for precision check
function checkPrecision(value: number, precision: number): boolean {
  const decimalPart = value.toString().split('.')[1]
  return !decimalPart || decimalPart.length <= precision
}

@Injectable()
export class NumberPropertyProcessor extends BasePropertyProcessor {
  validateFormat(_property: PropertyDefinition, value: unknown): ValidationResult {
    if (typeof value !== 'number') {
      return {
        valid: false,
        errors: ['The value must be a number'],
      }
    }
    return { valid: true }
  }

  async validateBusinessRules(
    _context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    const numberValue = value as number
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

  async transformToDbFormat(
    _context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
    issueId: number,
  ): Promise<DbInsertData> {
    const numberValue = value as number
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.NUMBER, null, numberValue)],
    }
  }
}

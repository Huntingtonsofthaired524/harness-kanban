import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

interface SelectPropertyConfig {
  options: Array<{ id: string; name: string; icon?: string; color?: string }>
}

@Injectable()
export class SelectPropertyProcessor extends BasePropertyProcessor {
  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult {
    if (value === null || value === undefined) {
      // allow null and undefined
      return { valid: true }
    }

    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: [`Property ${property.name} must be a string`],
      }
    }

    return { valid: true }
  }

  async validateBusinessRules(
    _baseContext: BaseContext,
    property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    const config = property.config as SelectPropertyConfig | undefined

    if (!config || !Array.isArray(config.options) || config.options.length === 0) {
      return {
        valid: false,
        errors: [`Property ${property.name} configuration error: No option list defined`],
      }
    }

    // empty string is also considered empty, allow validation
    if (value === '') {
      return { valid: true }
    }

    // check if the value exists in the option list
    const optionExists = config.options.some(option => option.id === String(value))

    if (!optionExists) {
      return {
        valid: false,
        errors: [`Property ${property.name} value is not in the valid option list`],
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
    if (value === null || value === undefined || value === '') {
      return {} // ignore null, undefined and empty string
    }
    const stringValue = String(value)
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.SELECT, stringValue, null)],
    }
  }
}

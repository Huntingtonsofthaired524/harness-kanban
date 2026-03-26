import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { getStatusPropertyConfig } from '@repo/shared/property/status-config'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

@Injectable()
export class StatusPropertyProcessor extends BasePropertyProcessor {
  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return {
        valid: false,
        errors: [`Property ${property.name} must be a non-empty string`],
      }
    }

    return { valid: true }
  }

  async validateBusinessRules(
    _context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    const config = getStatusPropertyConfig(property)
    if (!config) {
      return {
        valid: false,
        errors: [`Property ${property.name} configuration error: Invalid status config`],
      }
    }

    const statusExists = config.statuses.some(status => status.id === value)
    if (!statusExists) {
      return {
        valid: false,
        errors: [`Property ${property.name} value is not in the valid status list`],
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
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.STATUS, String(value), null)],
    }
  }
}

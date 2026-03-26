import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

const MAX_LENGTH = 10000

@Injectable()
export class RichTextPropertyProcessor extends BasePropertyProcessor {
  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult {
    if (value === null || value === undefined) {
      return { valid: true }
    }

    try {
      String(value)
      return { valid: true }
    } catch {
      return {
        valid: false,
        errors: [`Property ${property.name} must be a string`],
      }
    }
  }

  async validateBusinessRules(
    _baseContext: BaseContext,
    property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    if (value === null || value === undefined) {
      return { valid: true }
    }

    const stringValue = String(value)

    if (stringValue.length > MAX_LENGTH) {
      return {
        valid: false,
        errors: [`Property ${property.name} length cannot exceed ${MAX_LENGTH} characters`],
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
    if (value === null || value === undefined) {
      return {}
    }

    const stringValue = String(value)
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.RICH_TEXT, stringValue, null)],
    }
  }
}

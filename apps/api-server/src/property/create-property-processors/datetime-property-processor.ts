import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

// Utility function for timestamp precision check
function checkTimestampPrecision(timestamp: number, precision: 'millisecond'): boolean {
  if (precision === 'millisecond') {
    // Check if timestamp is 13 digits (milliseconds since epoch)
    return timestamp.toString().length === 13
  }
  return false
}

@Injectable()
export class DatetimePropertyProcessor extends BasePropertyProcessor {
  validateFormat(_property: PropertyDefinition, value: unknown): ValidationResult {
    // check if the value is a number
    if (typeof value !== 'number') {
      return { valid: false, errors: ['Datetime must be a number'] }
    }

    // check if the timestamp is milliseconds precision (13 digits)
    if (!checkTimestampPrecision(value, 'millisecond')) {
      return { valid: false, errors: ['Datetime must be milliseconds precision (13 digits)'] }
    }

    return { valid: true }
  }

  async validateBusinessRules(
    _baseContext: BaseContext,
    _property: PropertyDefinition,
    _value: unknown,
  ): Promise<ValidationResult> {
    // no business rules for datetime
    return { valid: true }
  }

  async transformToDbFormat(
    _context: BaseContext,
    property: PropertyDefinition,
    value: unknown,
    issueId: number,
  ): Promise<DbInsertData> {
    const timestamp = value as number
    const isoString = new Date(timestamp).toISOString()
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.DATETIME, isoString, timestamp)],
    }
  }
}

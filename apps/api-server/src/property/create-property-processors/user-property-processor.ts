import { BaseContext } from '@/issue/types/issue.types'
import { UserService } from '@/user/user.service'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

@Injectable()
export class UserPropertyProcessor extends BasePropertyProcessor {
  constructor(private readonly userService: UserService) {
    super()
  }

  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult {
    if (!value) {
      // ignore empty value
      return { valid: true }
    }
    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: [`Property ${property.name} must be a string type`],
      }
    }
    return { valid: true }
  }

  async validateBusinessRules(
    _context: BaseContext,
    _property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    if (!value) {
      return { valid: true }
    }
    const userId = String(value)

    const userExists = await this.userService.checkUserExists(userId)
    if (!userExists) {
      return {
        valid: false,
        errors: [`User ${userId} does not exist`],
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
    if (!value) {
      return {}
    }
    const stringValue = String(value)
    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.USER, stringValue, null)],
    }
  }
}

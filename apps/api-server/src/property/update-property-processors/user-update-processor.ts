import { BaseContext } from '@/issue/types/issue.types'
import { UserService } from '@/user/user.service'
import { Injectable } from '@nestjs/common'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'

@Injectable()
export class UserUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  constructor(private readonly userService: UserService) {
    super()
  }

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
        errors: [`Operation: ${operationType} not supported`],
      }
    }
    if (operationType === CommonPropertyOperationType.SET.toString()) {
      if (!('value' in payload)) {
        return {
          valid: false,
          errors: ['payload for SET operation must include value field'],
        }
      }
      const value = payload.value
      if (value !== null && typeof value !== 'string') {
        return {
          valid: false,
          errors: ['value field must be a string or null'],
        }
      }
    }
    return { valid: true }
  }

  async validateBusinessRules(
    _context: BaseContext,
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    _issueId?: number,
  ): Promise<ValidationResult> {
    if (operationType === CommonPropertyOperationType.CLEAR.toString()) {
      // no need to validate business rules for remove operation
      return {
        valid: true,
      }
    }
    const userId = payload.value as string
    const userExists = await this.userService.checkUserExists(userId)
    return {
      valid: userExists,
    }
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

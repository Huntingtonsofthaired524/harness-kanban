import { PrismaService } from '@/database/prisma.service'
import { BaseContext } from '@/issue/types/issue.types'
import { Injectable } from '@nestjs/common'
import { CommonPropertyOperationType } from '@repo/shared/property/constants'
import { getStatusPropertyConfig, getStatusTransitions } from '@repo/shared/property/status-config'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbUpdateOperationResult, ValidationResult } from '../types/property.types'
import { BaseUpdatePropertyProcessor } from './base'

@Injectable()
export class StatusUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  validateFormat(
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
  ): ValidationResult {
    if (operationType !== CommonPropertyOperationType.SET.toString()) {
      return {
        valid: false,
        errors: [`Status property does not support operation type: ${operationType}, only set is supported`],
      }
    }

    if (!('value' in payload)) {
      return {
        valid: false,
        errors: ['SET operation requires a value field'],
      }
    }

    if (typeof payload.value !== 'string' || payload.value.trim().length === 0) {
      return {
        valid: false,
        errors: [`Property ${property.name} must be updated with a non-empty string value`],
      }
    }

    return { valid: true }
  }

  async validateBusinessRules(
    _context: BaseContext,
    property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    issueId?: number,
  ): Promise<ValidationResult> {
    if (operationType !== CommonPropertyOperationType.SET.toString()) {
      return {
        valid: false,
        errors: [`Status property does not support operation type: ${operationType}`],
      }
    }

    const config = getStatusPropertyConfig(property)
    if (!config) {
      return {
        valid: false,
        errors: [`Property ${property.name} configuration error: Invalid status config`],
      }
    }

    const nextStatusId = payload.value as string
    const nextStatusExists = config.statuses.some(status => status.id === nextStatusId)
    if (!nextStatusExists) {
      return {
        valid: false,
        errors: [`The selected status "${nextStatusId}" is not in the valid status list`],
      }
    }

    if (!issueId) {
      return {
        valid: false,
        errors: ['Status updates require an issue ID'],
      }
    }

    const currentStatusRecord = await this.prisma.client.property_single_value.findFirst({
      where: {
        issue_id: issueId,
        property_id: property.id,
        deleted_at: null,
      },
      select: {
        value: true,
      },
    })

    if (!currentStatusRecord?.value) {
      return {
        valid: false,
        errors: [`Issue ${issueId} is missing a stored status value`],
      }
    }

    const currentStatusId = currentStatusRecord.value
    const allowedTransitions = getStatusTransitions(config, currentStatusId)
    const allowed = allowedTransitions.some(transition => transition.toStatusId === nextStatusId)

    if (!allowed) {
      return {
        valid: false,
        errors: [`Transition from "${currentStatusId}" to "${nextStatusId}" is not allowed`],
      }
    }

    return { valid: true }
  }

  async transformToDbOperations(
    _context: BaseContext,
    _property: PropertyDefinition,
    operationType: string,
    payload: Record<string, unknown>,
    _issueId: number,
  ): Promise<DbUpdateOperationResult> {
    if (operationType !== CommonPropertyOperationType.SET.toString()) {
      return {}
    }

    return {
      singleValueUpdate: {
        value: payload.value as string,
        number_value: null,
      },
    }
  }
}

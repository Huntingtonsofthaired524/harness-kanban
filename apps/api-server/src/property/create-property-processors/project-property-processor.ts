import { BaseContext } from '@/issue/types/issue.types'
import { ProjectService } from '@/project/project.service'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DbInsertData, ValidationResult } from '../types/property.types'
import { BasePropertyProcessor } from './base'

@Injectable()
export class ProjectPropertyProcessor extends BasePropertyProcessor {
  constructor(private readonly projectService: ProjectService) {
    super()
  }

  validateFormat(property: PropertyDefinition, value: unknown): ValidationResult {
    if (!value) {
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
    context: BaseContext,
    _property: PropertyDefinition,
    value: unknown,
  ): Promise<ValidationResult> {
    if (!value) {
      return { valid: true }
    }

    const projectExists = await this.projectService.checkProjectExists(context.workspaceId, String(value))
    if (!projectExists) {
      return {
        valid: false,
        errors: [`Project ${String(value)} does not exist`],
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

    return {
      singleValues: [this.createSingleValue(issueId, property.id, PropertyType.PROJECT, String(value), null)],
    }
  }
}

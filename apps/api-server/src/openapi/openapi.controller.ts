import { AuthService } from '@/auth/auth.service'
import { AuthWorkspaceId } from '@/auth/decorators/organization.decorator'
import { ApiResponse, makeSuccessResponse } from '@/common/responses/api-response'
import { PrismaService } from '@/database/prisma.service'
import { IssueService } from '@/issue/issue.service'
import { OpenApiAuthGuard } from '@/openapi/openapi.guard'
import { PropertyService } from '@/property/property.service'
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { FilterOperator } from '@repo/shared/property/constants'
import { FilterCondition, Operation } from '@repo/shared/property/types'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { OpenApiService } from './openapi.service'
import {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  CreateIssueRequest,
  CreateIssueResponse,
  FieldFilterCondition,
  FieldOperation,
  FieldSortConfig,
  FieldUpdateIssueRequest,
  GetIssuesResponse,
} from './types/openapi.types'

@Controller('openapi/v1')
export class OpenApiController {
  constructor(
    private readonly openApiService: OpenApiService,
    private readonly propertyService: PropertyService,
    private readonly issueService: IssueService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('keys')
  async createApiKey(
    @Body() body: CreateApiKeyRequest,
    @AuthWorkspaceId() workspaceId: string,
    @Session() session: UserSession,
  ): Promise<ApiResponse<CreateApiKeyResponse>> {
    const isAdmin = await this.authService.checkUserPermission(
      workspaceId,
      session.user.id,
      this.authService.MANAGE_ISSUE_PERMISSION,
    )
    if (!isAdmin) {
      throw new ForbiddenException('No access to create API keys')
    }

    const { name } = body
    const { apiKey, hashedKey, prefix } = this.openApiService.generateApiKey()

    await this.prisma.client.api_key.create({
      data: {
        name,
        hashed_key: hashedKey,
        prefix,
        created_by: session.user.id,
      },
    })

    // The full API key is only returned once upon creation.
    return makeSuccessResponse({ apiKey })
  }

  @Get('issues')
  @UseGuards(OpenApiAuthGuard)
  async getIssues(
    @Query('workspaceId') workspaceId: string,
    @Query('filters') filters?: string,
    @Query('sort') sort?: string,
  ): Promise<GetIssuesResponse> {
    // Parse query parameters
    const fieldFilters: FieldFilterCondition[] = filters ? (JSON.parse(filters) as FieldFilterCondition[]) : []
    const fieldSort: FieldSortConfig[] = sort ? (JSON.parse(sort) as FieldSortConfig[]) : []

    // Validate workspace exists
    try {
      await this.authService.getOrganization(workspaceId)
    } catch (error) {
      console.error(error)
      throw new ForbiddenException('Workspace does not exist')
    }

    // Get field => propertyId mapping
    const fieldMapping = await this.propertyService.getFieldToPropertyMapping()
    const propertyToFieldMapping = new Map([...fieldMapping].map(([field, { propertyId }]) => [propertyId, field]))

    // Convert field filters/sort to property filters/sort
    const { convertedFilters, convertedSort } = this.convertFieldsToProperties(fieldFilters, fieldSort, fieldMapping)

    // Call issue service
    const issuesResult = await this.issueService.getIssues(convertedFilters, convertedSort, workspaceId, 'and')

    // Convert response back to field format
    const convertedIssues = this.convertIssuesToFieldFormat(issuesResult.issues, propertyToFieldMapping)

    return {
      issues: convertedIssues,
      total: issuesResult.total,
    }
  }

  @Post('issues')
  @UseGuards(OpenApiAuthGuard)
  async createIssue(
    @Body() body: CreateIssueRequest,
    @Session() session: UserSession,
  ): Promise<ApiResponse<CreateIssueResponse>> {
    try {
      await this.authService.getOrganization(body.workspaceId)
    } catch (error) {
      console.error(error)
      throw new ForbiddenException('Workspace does not exist')
    }

    // field => propertyId mapping
    const fieldMapping = await this.propertyService.getFieldToPropertyMapping()
    const convertedIssue = {
      propertyValues: body.issue.fieldValues.map(fv => {
        const mapping = fieldMapping.get(fv.field)
        if (!mapping) {
          throw new BadRequestException(`Field '${fv.field}' not found`)
        }
        return {
          propertyId: mapping.propertyId,
          value: fv.value,
        }
      }),
    }

    const results = await this.issueService.batchCreateIssues(body.workspaceId, session.user.id, [convertedIssue])
    const result = results[0]

    const success = result.success
    if (!success) {
      throw new ForbiddenException(result.errors?.[0] ?? 'Failed to create issue')
    }

    return makeSuccessResponse({ issueId: result.issueId })
  }

  @Put('issues/:id')
  @UseGuards(OpenApiAuthGuard)
  async updateIssue(
    @Param('id', ParseIntPipe) issueId: number,
    @Body() body: FieldUpdateIssueRequest,
    @Session() session: UserSession,
  ): Promise<ApiResponse<null>> {
    // Validate workspace exists
    try {
      await this.authService.getOrganization(body.workspaceId)
    } catch (error) {
      console.error(error)
      throw new ForbiddenException('Workspace does not exist')
    }

    // field => propertyId mapping
    const fieldMapping = await this.propertyService.getFieldToPropertyMapping()
    const convertedOperations = this.convertFieldOperationsToPropertyOperations(body.operations, fieldMapping)

    const result = await this.issueService.updateIssue(
      { workspaceId: body.workspaceId, userId: session.user.id },
      { issueId, operations: convertedOperations },
    )
    if (!result.success) {
      throw new ForbiddenException(result.errors?.join(', ') || 'Failed to update issue')
    }

    return makeSuccessResponse(null)
  }

  private convertFieldsToProperties(
    fieldFilters: FieldFilterCondition[],
    fieldSort: FieldSortConfig[],
    fieldMapping: Map<string, { propertyId: string; propertyType: string }>,
  ): {
    convertedFilters: FilterCondition[]
    convertedSort: Array<{ id: string; desc: boolean }>
  } {
    const convertedFilters: FilterCondition[] = fieldFilters.map(filter => {
      const mapping = fieldMapping.get(filter.field)
      if (!mapping) {
        throw new BadRequestException(`Field '${filter.field}' not found`)
      }
      return {
        propertyId: mapping.propertyId,
        propertyType: mapping.propertyType,
        operator: filter.operator as FilterOperator,
        operand: filter.operand,
      }
    })

    const convertedSort = fieldSort.map(sortItem => {
      const mapping = fieldMapping.get(sortItem.field)
      if (!mapping) {
        throw new BadRequestException(`Field '${sortItem.field}' not found`)
      }
      return {
        id: mapping.propertyId,
        desc: sortItem.desc,
      }
    })

    return { convertedFilters, convertedSort }
  }

  private convertIssuesToFieldFormat(
    issues: Array<{ issueId: number; propertyValues: Array<{ propertyId: string; value: unknown }> }>,
    propertyToFieldMapping: Map<string, string>,
  ): Array<{ issueId: number; fieldValues: Array<{ field: string; value: unknown }> }> {
    return issues.map(issue => ({
      issueId: issue.issueId,
      fieldValues: issue.propertyValues.map(pv => ({
        field: propertyToFieldMapping.get(pv.propertyId) || pv.propertyId,
        value: pv.value,
      })),
    }))
  }

  private convertFieldOperationsToPropertyOperations(
    fieldOperations: FieldOperation[],
    fieldMapping: Map<string, { propertyId: string; propertyType: string }>,
  ): Operation[] {
    return fieldOperations.map((op: FieldOperation) => {
      const mapping = fieldMapping.get(op.field)
      if (!mapping) {
        throw new BadRequestException(`Field '${op.field}' not found`)
      }
      return {
        propertyId: mapping.propertyId,
        operationType: op.operationType,
        operationPayload: op.operationPayload,
      }
    })
  }
}

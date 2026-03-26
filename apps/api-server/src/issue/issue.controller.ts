import { z } from 'zod'

import { AuthWorkspaceId } from '@/auth/decorators/organization.decorator'
import { ApiResponse as BaseApiResponse, makeSuccessResponse } from '@/common/responses/api-response'
import { zodParse } from '@/common/zod/zod-parse'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { FilterCondition, ResolveStatusActionsResult } from '@repo/shared/property/types'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { IssueService } from './issue.service'
import {
  CreateIssueDto,
  CreateIssueResponseDto,
  CreateIssuesDto,
  CreateIssuesResponseDto,
  GetIssueResponseDto,
  GetIssuesResponseDto,
} from './types/issue.types'

const GetIssuesQuerySchema = z.object({
  filters: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

const OperationSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  operationType: z.string().min(1, 'Operation type is required'),
  operationPayload: z.record(z.string(), z.unknown()).default({}),
})

const UpdateIssueSchema = z.object({
  operations: z.array(OperationSchema).min(1, 'At least one operation is required'),
})

const ResolveStatusActionsSchema = z
  .object({
    issueId: z.number().int().positive().optional(),
    currentStatusId: z.string().min(1).optional(),
  })
  .refine(value => value.issueId !== undefined || value.currentStatusId !== undefined, {
    message: 'Either issueId or currentStatusId is required',
  })

@Controller('api/v1/issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get()
  async getIssues(
    @Query() queryRaw: unknown,
    @AuthWorkspaceId() workspaceId: string,
  ): Promise<BaseApiResponse<GetIssuesResponseDto>> {
    const query = zodParse(GetIssuesQuerySchema, queryRaw)

    const filters: FilterCondition[] = query.filters ? JSON.parse(query.filters) : []
    const sort: { id: string; desc: boolean }[] = query.sort ? JSON.parse(query.sort) : []
    const page = query.page
    const perPage = query.perPage

    const issuesResult = await this.issueService.getIssues(filters, sort, workspaceId, 'and', page, perPage)
    const totalPages = Math.ceil(issuesResult.total / perPage)

    return makeSuccessResponse({
      issues: issuesResult.issues,
      pagination: {
        total: issuesResult.total,
        page: query.page,
        perPage: query.perPage,
        totalPages,
      },
    })
  }

  @Post()
  async createIssue(
    @Body() createIssueDto: CreateIssueDto,
    @AuthWorkspaceId() workspaceId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<CreateIssueResponseDto>> {
    const userId = session.user.id
    const results = await this.issueService.batchCreateIssues(workspaceId, userId, [createIssueDto.issue])
    const result = results[0]

    if (!result.success) {
      throw new BadRequestException(result.errors?.[0] ?? 'Failed to create issue')
    }

    return makeSuccessResponse({
      issueId: result.issueId,
    })
  }

  @Post('batch')
  async createIssues(
    @Body() createIssuesDto: CreateIssuesDto,
    @AuthWorkspaceId() workspaceId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<CreateIssuesResponseDto>> {
    const userId = session.user.id
    const results = await this.issueService.batchCreateIssues(workspaceId, userId, createIssuesDto.issues)

    return makeSuccessResponse({
      results: results.map(result => ({
        issueId: result.issueId,
        success: result.success,
        errors: result.errors,
      })),
    })
  }

  @Post('status-actions/resolve')
  async resolveStatusActions(
    @Body() bodyRaw: unknown,
    @AuthWorkspaceId() workspaceId: string,
  ): Promise<BaseApiResponse<ResolveStatusActionsResult>> {
    const body = zodParse(ResolveStatusActionsSchema, bodyRaw)
    const result = await this.issueService.resolveStatusActions(workspaceId, body)
    return makeSuccessResponse(result)
  }

  @Get(':id')
  async getIssue(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<GetIssueResponseDto>> {
    const issue = await this.issueService.getIssueById(id)
    return makeSuccessResponse({ issue })
  }

  @Put(':id')
  async updateIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIssueDtoRaw: unknown,
    @AuthWorkspaceId() workspaceId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<null>> {
    const updateIssueDto = zodParse(UpdateIssueSchema, updateIssueDtoRaw)
    const userId = session.user.id

    const result = await this.issueService.updateIssue(
      { workspaceId: workspaceId, userId: userId },
      { issueId: id, operations: updateIssueDto.operations },
    )
    if (!result.success) {
      throw new ForbiddenException(result.errors?.[0] ?? 'Failed to update issue')
    }

    return makeSuccessResponse(null)
  }

  @Delete(':id')
  async deleteIssue(
    @Param('id', ParseIntPipe) id: number,
    @AuthWorkspaceId() workspaceId: string,
    @Session() session: UserSession,
  ): Promise<BaseApiResponse<null>> {
    await this.issueService.deleteIssue(workspaceId, session.user.id, id)
    return makeSuccessResponse(null)
  }
}

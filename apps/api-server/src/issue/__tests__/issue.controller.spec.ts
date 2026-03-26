import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { CommonPropertyOperationType, SystemPropertyId } from '@repo/shared/property/constants'
import { IssueController } from '../issue.controller'
import { IssueService } from '../issue.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: () => () => undefined,
}))

describe('IssueController', () => {
  let controller: IssueController
  let issueService: jest.Mocked<IssueService>

  beforeEach(() => {
    issueService = {
      getIssues: jest.fn(),
      batchCreateIssues: jest.fn(),
      getIssueById: jest.fn(),
      updateIssue: jest.fn(),
      deleteIssue: jest.fn(),
    } as unknown as jest.Mocked<IssueService>

    controller = new IssueController(issueService)
  })

  it('getIssues should parse query and return pagination', async () => {
    issueService.getIssues.mockResolvedValue({
      issues: [{ issueId: 101, propertyValues: [] }],
      total: 21,
    } as any)

    const filters = [{ propertyId: SystemPropertyId.TITLE, propertyType: 'title', operator: 'contains', operand: 'x' }]
    const sort = [{ id: SystemPropertyId.TITLE, desc: true }]

    const response = await controller.getIssues(
      {
        filters: JSON.stringify(filters),
        sort: JSON.stringify(sort),
        page: '2',
        perPage: '10',
      },
      'workspace-1',
    )

    expect(issueService.getIssues).toHaveBeenCalledWith(filters, sort, 'workspace-1', 'and', 2, 10)
    expect(response.success).toBe(true)
    expect(response.data!.issues).toHaveLength(1)
    expect(response.data!.pagination).toEqual({
      total: 21,
      page: 2,
      perPage: 10,
      totalPages: 3,
    })
  })

  it('getIssues should throw BadRequestException when page is invalid', async () => {
    await expect(controller.getIssues({ page: '0' }, 'workspace-1')).rejects.toThrow(BadRequestException)
  })

  it('createIssue should throw BadRequestException when create fails', async () => {
    issueService.batchCreateIssues.mockResolvedValue([
      {
        success: false,
        errors: ['create failed'],
      },
    ] as any)

    await expect(
      controller.createIssue(
        {
          issue: {
            propertyValues: [{ propertyId: SystemPropertyId.TITLE, value: 'title' }],
          },
        },
        'workspace-1',
        { user: { id: 'user-1' } } as any,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('createIssues should map service results', async () => {
    issueService.batchCreateIssues.mockResolvedValue([
      { issueId: 1, success: true },
      { issueId: 2, success: false, errors: ['invalid value'] },
    ] as any)

    const response = await controller.createIssues(
      {
        issues: [
          { propertyValues: [{ propertyId: SystemPropertyId.TITLE, value: 'a' }] },
          { propertyValues: [{ propertyId: SystemPropertyId.TITLE, value: 'b' }] },
        ],
      },
      'workspace-1',
      { user: { id: 'user-1' } } as any,
    )

    expect(issueService.batchCreateIssues).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ propertyValues: expect.any(Array) }),
        expect.objectContaining({ propertyValues: expect.any(Array) }),
      ]),
    )
    expect(response.success).toBe(true)
    expect(response.data!.results).toEqual([
      { issueId: 1, success: true, errors: undefined },
      { issueId: 2, success: false, errors: ['invalid value'] },
    ])
  })

  it('updateIssue should throw BadRequestException when operations is empty', async () => {
    await expect(
      controller.updateIssue(100, { operations: [] }, 'workspace-1', { user: { id: 'user-1' } } as any),
    ).rejects.toThrow(BadRequestException)
  })

  it('updateIssue should throw ForbiddenException when service returns failure', async () => {
    issueService.updateIssue.mockResolvedValue({ success: false, errors: ['no permission'] } as any)

    await expect(
      controller.updateIssue(
        100,
        {
          operations: [
            {
              propertyId: SystemPropertyId.TITLE,
              operationType: CommonPropertyOperationType.SET,
              operationPayload: { value: 'updated' },
            },
          ],
        },
        'workspace-1',
        { user: { id: 'user-1' } } as any,
      ),
    ).rejects.toThrow(ForbiddenException)
  })

  it('deleteIssue should call service with workspace and user id', async () => {
    issueService.deleteIssue.mockResolvedValue(undefined)

    const response = await controller.deleteIssue(100, 'workspace-1', { user: { id: 'user-1' } } as any)

    expect(issueService.deleteIssue).toHaveBeenCalledWith('workspace-1', 'user-1', 100)
    expect(response.success).toBe(true)
  })
})

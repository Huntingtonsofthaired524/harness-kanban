import { IssueCreatedEvent, IssueUpdatedEvent } from '@/event-bus/types/event.types'
import { IssueService } from '@/issue/issue.service'
import { SystemBotId } from '@/user/constants/user.constants'
import { CommonPropertyOperationType, SystemPropertyId } from '@repo/shared/property/constants'
import { CodeBotAutoQueueListener } from '../listeners/issue-code-bot.listeners'

describe('CodeBotAutoQueueListener', () => {
  let listener: CodeBotAutoQueueListener
  let getIssueStatesMock: jest.Mock
  let updateIssueMock: jest.Mock

  beforeEach(() => {
    getIssueStatesMock = jest.fn().mockResolvedValue(new Map())
    updateIssueMock = jest.fn().mockResolvedValue({ success: true, issueId: 1 })

    const issueService = {
      getIssueStates: getIssueStatesMock,
      updateIssue: updateIssueMock,
    } as unknown as jest.Mocked<IssueService>

    listener = new CodeBotAutoQueueListener(issueService)
  })

  it('auto-queues created issues assigned to Code Bot', async () => {
    getIssueStatesMock.mockResolvedValueOnce(
      new Map([
        [
          10,
          {
            assigneeId: SystemBotId.CODE_BOT,
            statusId: 'todo',
          },
        ],
      ]),
    )

    const event: IssueCreatedEvent = {
      issues: [
        {
          workspaceId: 'workspace-1',
          userId: 'user-1',
          issueId: 10,
        },
      ],
    }

    await listener.handleIssueCreated(event)

    expect(updateIssueMock).toHaveBeenCalledWith(
      {
        workspaceId: 'workspace-1',
        userId: SystemBotId.CODE_BOT,
      },
      {
        issueId: 10,
        operations: [
          {
            propertyId: SystemPropertyId.STATUS,
            operationType: CommonPropertyOperationType.SET,
            operationPayload: { value: 'queued' },
          },
        ],
      },
    )
  })

  it('auto-queues issues when the assignee changes to Code Bot', async () => {
    getIssueStatesMock.mockResolvedValueOnce(
      new Map([
        [
          20,
          {
            assigneeId: SystemBotId.CODE_BOT,
            statusId: 'todo',
          },
        ],
      ]),
    )

    const event: IssueUpdatedEvent = {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      issueId: 20,
      updatedPropertyIds: [SystemPropertyId.ASSIGNEE],
      propertyChanges: [],
    }

    await listener.handleIssueUpdated(event)

    expect(updateIssueMock).toHaveBeenCalledTimes(1)
  })

  it('skips auto-queue when the issue is already queued', async () => {
    getIssueStatesMock.mockResolvedValueOnce(
      new Map([
        [
          30,
          {
            assigneeId: SystemBotId.CODE_BOT,
            statusId: 'queued',
          },
        ],
      ]),
    )

    await listener.handleIssueCreated({
      issues: [
        {
          workspaceId: 'workspace-1',
          userId: 'user-1',
          issueId: 30,
        },
      ],
    })

    expect(updateIssueMock).not.toHaveBeenCalled()
  })

  it('skips auto-queue when the issue is assigned to another user', async () => {
    getIssueStatesMock.mockResolvedValueOnce(
      new Map([
        [
          40,
          {
            assigneeId: 'user-2',
            statusId: 'todo',
          },
        ],
      ]),
    )

    await listener.handleIssueCreated({
      issues: [
        {
          workspaceId: 'workspace-1',
          userId: 'user-1',
          issueId: 40,
        },
      ],
    })

    expect(updateIssueMock).not.toHaveBeenCalled()
  })

  it('ignores issue updates that do not change the assignee', async () => {
    const event: IssueUpdatedEvent = {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      issueId: 50,
      updatedPropertyIds: [SystemPropertyId.STATUS],
      propertyChanges: [],
    }

    await listener.handleIssueUpdated(event)

    expect(getIssueStatesMock).not.toHaveBeenCalled()
    expect(updateIssueMock).not.toHaveBeenCalled()
  })

  it('does not auto-queue continuation reassignments outside Todo', async () => {
    getIssueStatesMock.mockResolvedValueOnce(
      new Map([
        [
          60,
          {
            assigneeId: SystemBotId.CODE_BOT,
            statusId: 'planning',
          },
        ],
      ]),
    )

    await listener.handleIssueUpdated({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      issueId: 60,
      updatedPropertyIds: [SystemPropertyId.ASSIGNEE],
      propertyChanges: [],
    })

    expect(updateIssueMock).not.toHaveBeenCalled()
  })
})

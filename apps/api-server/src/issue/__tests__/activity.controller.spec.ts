import { BadRequestException } from '@nestjs/common'
import { ActivityController } from '../activity.controller'
import { ActivityService } from '../activity.service'

describe('ActivityController', () => {
  let controller: ActivityController
  let activityService: jest.Mocked<ActivityService>

  beforeEach(() => {
    activityService = {
      getActivities: jest.fn(),
      subscribeToIssue: jest.fn(),
      unsubscribeFromIssue: jest.fn(),
    } as unknown as jest.Mocked<ActivityService>

    controller = new ActivityController(activityService)
  })

  it('getIssueActivities should map subscriberIds to subscribers and normalize issueId to number', async () => {
    activityService.getActivities.mockResolvedValue({
      activities: [{ id: 'a1', issueId: '123', type: 'comment' }],
      subscriberIds: ['u1', 'u2'],
      total: 1,
      page: 1,
      pageSize: 20,
    } as any)

    const response = await controller.getIssueActivities(123, { descOrder: 'true', page: '1', pageSize: '20' })

    expect(activityService.getActivities).toHaveBeenCalledWith(123, true, 1, 20)
    expect(response.success).toBe(true)
    expect(response.data!.subscribers).toEqual(['u1', 'u2'])
    expect(response.data!.activities[0].issueId).toBe(123)
  })

  it('subscribeToIssue should validate body and call service', async () => {
    activityService.subscribeToIssue.mockResolvedValue(undefined)

    const response = await controller.subscribeToIssue(321, { userIds: ['u1', 'u2'] })

    expect(activityService.subscribeToIssue).toHaveBeenCalledWith(321, ['u1', 'u2'])
    expect(response.success).toBe(true)
  })

  it('subscribeToIssue should throw BadRequestException for empty userIds', async () => {
    await expect(controller.subscribeToIssue(321, { userIds: [] })).rejects.toThrow(BadRequestException)
  })

  it('unsubscribeFromIssue should parse comma-separated userIds and call service', async () => {
    activityService.unsubscribeFromIssue.mockResolvedValue(undefined)

    const response = await controller.unsubscribeFromIssue(555, { userIds: 'u1,u2' })

    expect(activityService.unsubscribeFromIssue).toHaveBeenCalledWith(555, ['u1', 'u2'])
    expect(response.success).toBe(true)
  })

  it('unsubscribeFromIssue should throw BadRequestException when userIds is empty', async () => {
    await expect(controller.unsubscribeFromIssue(555, { userIds: '' })).rejects.toThrow(BadRequestException)
  })
})

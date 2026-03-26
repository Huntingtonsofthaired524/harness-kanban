import { PrismaService } from '@/database/prisma.service'
import { Prisma } from '@repo/database'
import { HarnessWorkerDevpodService } from '../harness-worker-devpod.service'
import { HarnessWorkerRegistryService } from '../harness-worker-registry.service'
import {
  DEFAULT_HARNESS_WORKER_HEARTBEAT_INTERVAL_MS,
  HARNESS_WORKER_BUSY_STATUS,
  HARNESS_WORKER_IDLE_STATUS,
} from '../harness-worker.constants'

describe('HarnessWorkerRegistryService', () => {
  let service: HarnessWorkerRegistryService
  let createMock: jest.Mock
  let updateMock: jest.Mock
  let updateManyMock: jest.Mock
  let deleteMock: jest.Mock
  let queryRawMock: jest.Mock
  let transactionMock: jest.Mock
  let devpodService: jest.Mocked<HarnessWorkerDevpodService>

  beforeEach(() => {
    createMock = jest.fn().mockResolvedValue({ id: 'worker-1' })
    updateMock = jest.fn().mockResolvedValue({ id: 'worker-1' })
    updateManyMock = jest.fn().mockResolvedValue({ count: 0 })
    deleteMock = jest.fn().mockResolvedValue({ id: 'worker-1' })
    queryRawMock = jest.fn().mockResolvedValue([])

    transactionMock = jest.fn().mockImplementation(async callback =>
      callback({
        harness_worker: {
          updateMany: updateManyMock,
        },
        $queryRaw: queryRawMock,
      }),
    )

    const prismaService = {
      client: {
        $transaction: transactionMock,
        harness_worker: {
          create: createMock,
          update: updateMock,
          delete: deleteMock,
        },
      },
    } as unknown as jest.Mocked<PrismaService>

    devpodService = {
      getWorkspaceNameForIssue: jest.fn((issueId: number) => `harness-kanban-issue-${issueId}`),
      deleteWorkspace: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<HarnessWorkerDevpodService>

    service = new HarnessWorkerRegistryService(prismaService, devpodService)
  })

  afterEach(() => {
    jest.useRealTimers()
    service.stopHeartbeat()
  })

  it('registers a new worker row as idle', async () => {
    const workerId = await service.register()

    expect(workerId).toBe('worker-1')
    expect(service.currentWorkerId).toBe('worker-1')
    expect(createMock).toHaveBeenCalledWith({
      data: {
        last_updated_at: expect.any(Date),
        devpod_metadata: Prisma.DbNull,
        issue_id: null,
        status: HARNESS_WORKER_IDLE_STATUS,
      },
    })
  })

  it('starts a repeating heartbeat timer during registration', async () => {
    jest.useFakeTimers()

    await service.register()
    jest.advanceTimersByTime(DEFAULT_HARNESS_WORKER_HEARTBEAT_INTERVAL_MS)
    await Promise.resolve()

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'worker-1' },
      data: {
        issue_id: null,
        status: HARNESS_WORKER_IDLE_STATUS,
        last_updated_at: expect.any(Date),
      },
    })
  })

  it('returns null when there is no queued issue to claim', async () => {
    await service.register()

    const claim = await service.claimNextQueuedIssue()

    expect(claim).toBeNull()
    expect(updateManyMock).not.toHaveBeenCalled()
    expect(service.currentIssueId).toBeNull()
  })

  it('claims the selected queued issue on the current worker row', async () => {
    await service.register()
    queryRawMock.mockResolvedValueOnce([{ id: 321, workspace_id: 'workspace-1' }])
    updateManyMock.mockResolvedValueOnce({ count: 1 })

    const claim = await service.claimNextQueuedIssue()

    expect(claim).toEqual({
      issueId: 321,
      workspaceId: 'workspace-1',
    })
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        id: 'worker-1',
        issue_id: null,
      },
      data: {
        devpod_metadata: Prisma.DbNull,
        issue_id: 321,
        status: HARNESS_WORKER_BUSY_STATUS,
        last_updated_at: expect.any(Date),
      },
    })
    expect(service.currentIssueId).toBe(321)
    expect(service.currentStatus).toBe(HARNESS_WORKER_BUSY_STATUS)
  })

  it('persists busy status while a claimed issue is held in heartbeat updates', async () => {
    await service.register()
    queryRawMock.mockResolvedValueOnce([{ id: 99, workspace_id: 'workspace-1' }])
    updateManyMock.mockResolvedValueOnce({ count: 1 })
    await service.claimNextQueuedIssue()

    await service.heartbeat()

    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: 'worker-1' },
      data: {
        issue_id: 99,
        status: HARNESS_WORKER_BUSY_STATUS,
        last_updated_at: expect.any(Date),
      },
    })
  })

  it('releases the current claim and returns the worker to idle', async () => {
    await service.register()
    queryRawMock.mockResolvedValueOnce([{ id: 99, workspace_id: 'workspace-1' }])
    updateManyMock.mockResolvedValueOnce({ count: 1 })
    await service.claimNextQueuedIssue()

    await service.releaseClaim()

    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: 'worker-1' },
      data: {
        devpod_metadata: Prisma.DbNull,
        issue_id: null,
        status: HARNESS_WORKER_IDLE_STATUS,
        last_updated_at: expect.any(Date),
      },
    })
    expect(service.currentIssueId).toBeNull()
    expect(service.currentStatus).toBe(HARNESS_WORKER_IDLE_STATUS)
  })

  it('deletes an idle worker row during shutdown', async () => {
    await service.register()

    await service.onApplicationShutdown()

    expect(devpodService.deleteWorkspace).not.toHaveBeenCalled()
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 'worker-1' },
    })
    expect(service.currentWorkerId).toBeNull()
    expect(service.currentIssueId).toBeNull()
  })

  it('deletes a busy worker row during shutdown', async () => {
    await service.register()
    queryRawMock.mockResolvedValueOnce([{ id: 99, workspace_id: 'workspace-1' }])
    updateManyMock.mockResolvedValueOnce({ count: 1 })
    await service.claimNextQueuedIssue()

    await service.onApplicationShutdown()

    expect(devpodService.getWorkspaceNameForIssue).toHaveBeenCalledWith(99)
    expect(devpodService.deleteWorkspace).toHaveBeenCalledWith('harness-kanban-issue-99')
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 'worker-1' },
    })
    expect(service.currentWorkerId).toBeNull()
    expect(service.currentIssueId).toBeNull()
  })

  it('still deletes the worker row when workspace cleanup fails during shutdown', async () => {
    await service.register()
    queryRawMock.mockResolvedValueOnce([{ id: 99, workspace_id: 'workspace-1' }])
    updateManyMock.mockResolvedValueOnce({ count: 1 })
    await service.claimNextQueuedIssue()
    devpodService.deleteWorkspace.mockRejectedValueOnce(new Error('cleanup failed'))

    await service.onApplicationShutdown()

    expect(devpodService.deleteWorkspace).toHaveBeenCalledWith('harness-kanban-issue-99')
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 'worker-1' },
    })
  })
})

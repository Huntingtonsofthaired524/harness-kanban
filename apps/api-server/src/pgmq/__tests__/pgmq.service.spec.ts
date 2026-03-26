import { PrismaService } from '@/database/prisma.service'
import { PgmqService } from '../pgmq.service'

describe('PgmqService', () => {
  let service: PgmqService
  let executeRawUnsafeMock: jest.Mock
  let executeRawMock: jest.Mock
  let queryRawMock: jest.Mock

  beforeEach(() => {
    executeRawUnsafeMock = jest.fn().mockResolvedValue(0)
    executeRawMock = jest.fn().mockResolvedValue(0)
    queryRawMock = jest.fn()

    const prismaService = {
      client: {
        $executeRawUnsafe: executeRawUnsafeMock,
        $executeRaw: executeRawMock,
        $queryRaw: queryRawMock,
      },
    } as unknown as jest.Mocked<PrismaService>

    service = new PgmqService(prismaService)
  })

  it('initializes a queue and sends payloads', async () => {
    queryRawMock.mockResolvedValueOnce([{ message_id: 7n }])

    const messageId = await service.send('harness_issue_dispatch', { issueId: 123 })

    expect(messageId).toBe(7)
    expect(executeRawUnsafeMock).toHaveBeenCalledWith('CREATE EXTENSION IF NOT EXISTS pgmq')
    expect(executeRawMock).toHaveBeenCalledTimes(1)
    expect(queryRawMock).toHaveBeenCalledTimes(1)
  })

  it('reuses one initialization across repeated sends', async () => {
    queryRawMock.mockResolvedValueOnce([{ message_id: 7n }])
    queryRawMock.mockResolvedValueOnce([{ message_id: 8n }])

    await service.send('harness_issue_dispatch', { issueId: 1 })
    await service.send('harness_issue_dispatch', { issueId: 2 })

    expect(executeRawUnsafeMock).toHaveBeenCalledTimes(1)
    expect(executeRawMock).toHaveBeenCalledTimes(1)
    expect(queryRawMock).toHaveBeenCalledTimes(2)
  })

  it('archives messages after initialization', async () => {
    queryRawMock.mockResolvedValueOnce([{ archived: true }])

    const archived = await service.archive('harness_issue_dispatch', 11)

    expect(archived).toBe(true)
    expect(executeRawUnsafeMock).toHaveBeenCalledTimes(1)
    expect(executeRawMock).toHaveBeenCalledTimes(1)
    expect(queryRawMock).toHaveBeenCalledTimes(1)
  })
})

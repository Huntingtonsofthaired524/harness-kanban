import { PrismaService } from '@/database/prisma.service'
import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { StatusUpdatePropertyProcessor } from '../status-update-processor'

describe('StatusUpdatePropertyProcessor', () => {
  let processor: StatusUpdatePropertyProcessor
  let prisma: jest.Mocked<PrismaService>
  let findFirstMock: jest.Mock

  const mockProperty: PropertyDefinition = {
    id: 'status-prop',
    name: 'Status',
    type: PropertyType.STATUS,
    readonly: false,
    deletable: false,
    config: {
      initialStatusId: 'todo',
      statuses: [
        { id: 'todo', label: 'Todo', icon: 'Circle' },
        { id: 'in_progress', label: 'In progress', icon: 'Hammer' },
        { id: 'completed', label: 'Completed', icon: 'BadgeCheck' },
      ],
      transitions: {
        todo: [{ toStatusId: 'in_progress', actionLabel: 'Start work' }],
        in_progress: [{ toStatusId: 'completed', actionLabel: 'Complete' }],
        completed: [],
      },
    },
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  beforeEach(() => {
    prisma = {
      client: {
        property_single_value: {
          findFirst: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<PrismaService>

    processor = new StatusUpdatePropertyProcessor(prisma)
    findFirstMock = prisma.client.property_single_value.findFirst as unknown as jest.Mock
  })

  describe('validateFormat', () => {
    it('should return valid for a set operation with a non-empty string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 'in_progress',
      })

      expect(result.valid).toBe(true)
    })

    it('should reject clear operations', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Status property does not support operation type: clear, only set is supported')
    })

    it('should reject set operations without a value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {})

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('SET operation requires a value field')
    })

    it('should reject set operations with an empty string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: '',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status must be updated with a non-empty string value')
    })
  })

  describe('validateBusinessRules', () => {
    it('should reject updates when config is invalid', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        {
          ...mockProperty,
          config: undefined,
        },
        CommonPropertyOperationType.SET.toString(),
        { value: 'in_progress' },
        123,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status configuration error: Invalid status config')
    })

    it('should reject updates to an unknown status', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'queued' },
        123,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The selected status "queued" is not in the valid status list')
    })

    it('should reject updates without an issue id', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'in_progress' },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Status updates require an issue ID')
    })

    it('should allow a transition from the current stored status', async () => {
      findFirstMock.mockResolvedValue({ value: 'todo' } as never)

      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'in_progress' },
        123,
      )

      expect(result.valid).toBe(true)
      expect(prisma.client.property_single_value.findFirst).toHaveBeenCalledWith({
        where: {
          issue_id: 123,
          property_id: 'status-prop',
          deleted_at: null,
        },
        select: {
          value: true,
        },
      })
    })

    it('should reject updates when the issue has no stored status', async () => {
      findFirstMock.mockResolvedValue(null)

      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'in_progress' },
        123,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Issue 123 is missing a stored status value')
    })

    it('should reject transitions that are not allowed', async () => {
      findFirstMock.mockResolvedValue({ value: 'todo' } as never)

      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'completed' },
        123,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Transition from "todo" to "completed" is not allowed')
    })
  })

  describe('transformToDbOperations', () => {
    it('should return a single value update for set operations', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'completed' },
        123,
      )

      expect(result).toEqual({
        singleValueUpdate: {
          value: 'completed',
          number_value: null,
        },
      })
    })

    it('should return no-op operations for unsupported operation types', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.CLEAR.toString(),
        {},
        123,
      )

      expect(result).toEqual({})
    })
  })
})

import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { UserUpdatePropertyProcessor } from '../user-update-processor'

describe('UserUpdatePropertyProcessor', () => {
  let processor: UserUpdatePropertyProcessor
  let mockUserService: { checkUserExists: jest.Mock }

  beforeEach(() => {
    mockUserService = {
      checkUserExists: jest.fn(),
    }
    processor = new UserUpdatePropertyProcessor(mockUserService as unknown as import('@/user/user.service').UserService)
  })

  const mockProperty: PropertyDefinition = {
    id: 'user-prop',
    name: 'Assignee',
    type: PropertyType.USER,
    readonly: false,
    deletable: true,
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  describe('validateFormat', () => {
    it('should return valid for SET operation with string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 'user-123',
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with null value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: null })

      expect(result.valid).toBe(true)
    })

    it('should return valid for CLEAR operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(true)
    })

    it('should return invalid for unsupported operation type', () => {
      const result = processor.validateFormat(mockProperty, '2', { value: 'user-123' })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Operation: 2 not supported')
    })

    it('should return invalid when value field is missing in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {})

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('payload for SET operation must include value field')
    })

    it('should return invalid when value is number in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: 123 })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('value field must be a string or null')
    })

    it('should return invalid when value is object in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: { id: 'user-123' },
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('value field must be a string or null')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid for CLEAR operation without checking user service', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.CLEAR.toString(),
        {},
      )

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).not.toHaveBeenCalled()
    })

    it('should return valid when user exists', async () => {
      mockUserService.checkUserExists.mockResolvedValue(true)

      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'user-123' },
      )

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).toHaveBeenCalledWith('user-123')
    })

    it('should return invalid when user does not exist', async () => {
      mockUserService.checkUserExists.mockResolvedValue(false)

      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'nonexistent-user' },
      )

      expect(result.valid).toBe(false)
      expect(mockUserService.checkUserExists).toHaveBeenCalledWith('nonexistent-user')
    })
  })

  describe('transformToDbOperations', () => {
    it('should transform SET operation to singleValueUpdate', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'user-123' },
        456,
      )

      expect(result.singleValueUpdate).toEqual({
        value: 'user-123',
        number_value: null,
      })
      expect(result.singleValueClear).toBeUndefined()
    })

    it('should transform SET operation with null to singleValueUpdate', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: null },
        789,
      )

      expect(result.singleValueUpdate).toEqual({
        value: null,
        number_value: null,
      })
    })

    it('should transform CLEAR operation to singleValueClear', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.CLEAR.toString(),
        {},
        100,
      )

      expect(result.singleValueClear).toBe(true)
      expect(result.singleValueUpdate).toBeUndefined()
    })
  })
})

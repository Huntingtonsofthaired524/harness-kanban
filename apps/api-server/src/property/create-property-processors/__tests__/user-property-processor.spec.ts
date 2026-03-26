import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { UserPropertyProcessor } from '../user-property-processor'

describe('UserPropertyProcessor', () => {
  let processor: UserPropertyProcessor
  let mockUserService: { checkUserExists: jest.Mock }

  beforeEach(() => {
    mockUserService = {
      checkUserExists: jest.fn(),
    }
    processor = new UserPropertyProcessor(mockUserService as unknown as import('@/user/user.service').UserService)
  })

  const mockProperty: PropertyDefinition = {
    id: 'user-prop',
    name: 'Assignee',
    type: PropertyType.USER,
    readonly: false,
    deletable: true,
  }

  describe('validateFormat', () => {
    it('should return valid for null value', () => {
      const result = processor.validateFormat(mockProperty, null)

      expect(result.valid).toBe(true)
    })

    it('should return valid for undefined value', () => {
      const result = processor.validateFormat(mockProperty, undefined)

      expect(result.valid).toBe(true)
    })

    it('should return valid for empty string', () => {
      const result = processor.validateFormat(mockProperty, '')

      expect(result.valid).toBe(true)
    })

    it('should return valid for user id string', () => {
      const result = processor.validateFormat(mockProperty, 'user-123')

      expect(result.valid).toBe(true)
    })

    it('should return invalid for number value', () => {
      const result = processor.validateFormat(mockProperty, 123)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Assignee must be a string type')
    })

    it('should return invalid for object value', () => {
      const result = processor.validateFormat(mockProperty, { id: 'user-123' })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Assignee must be a string type')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid for null value without checking user service', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        null,
      )

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).not.toHaveBeenCalled()
    })

    it('should return valid for undefined value without checking user service', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        undefined,
      )

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).not.toHaveBeenCalled()
    })

    it('should return valid for empty string without checking user service', async () => {
      const result = await processor.validateBusinessRules({ userId: 'user-1', workspaceId: 'ws-1' }, mockProperty, '')

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).not.toHaveBeenCalled()
    })

    it('should return valid when user exists', async () => {
      mockUserService.checkUserExists.mockResolvedValue(true)

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'user-123',
      )

      expect(result.valid).toBe(true)
      expect(mockUserService.checkUserExists).toHaveBeenCalledWith('user-123')
    })

    it('should return invalid when user does not exist', async () => {
      mockUserService.checkUserExists.mockResolvedValue(false)

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'nonexistent-user',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('User nonexistent-user does not exist')
      expect(mockUserService.checkUserExists).toHaveBeenCalledWith('nonexistent-user')
    })
  })

  describe('transformToDbFormat', () => {
    it('should return empty object for null value', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, null, 123)

      expect(result).toEqual({})
    })

    it('should return empty object for undefined value', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, undefined, 123)

      expect(result).toEqual({})
    })

    it('should return empty object for empty string', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, '', 123)

      expect(result).toEqual({})
    })

    it('should transform user id to single value format', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 'user-456', 789)

      expect(result.singleValues).toHaveLength(1)
      expect(result.singleValues![0]).toEqual({
        issue_id: 789,
        property_id: 'user-prop',
        property_type: PropertyType.USER,
        value: 'user-456',
        number_value: null,
      })
    })

    it('should convert number to string for user id', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 12345, 100)

      expect(result.singleValues![0].value).toBe('12345')
    })
  })
})

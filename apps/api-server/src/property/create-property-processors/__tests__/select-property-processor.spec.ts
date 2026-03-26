import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { SelectPropertyProcessor } from '../select-property-processor'

describe('SelectPropertyProcessor', () => {
  let processor: SelectPropertyProcessor

  beforeEach(() => {
    processor = new SelectPropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'select-prop',
    name: 'Status',
    type: PropertyType.SELECT,
    readonly: false,
    deletable: true,
    config: {
      options: [
        { id: 'opt-1', name: 'Option 1', color: '#ff0000' },
        { id: 'opt-2', name: 'Option 2', color: '#00ff00' },
        { id: 'opt-3', name: 'Option 3' },
      ],
    },
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

    it('should return valid for string value', () => {
      const result = processor.validateFormat(mockProperty, 'opt-1')

      expect(result.valid).toBe(true)
    })

    it('should return invalid for non-string value', () => {
      const result = processor.validateFormat(mockProperty, 123)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status must be a string')
    })

    it('should return invalid for object value', () => {
      const result = processor.validateFormat(mockProperty, { id: 'opt-1' })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status must be a string')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return error when no options configured', async () => {
      const propertyWithoutOptions: PropertyDefinition = {
        id: 'select-prop',
        name: 'Status',
        type: PropertyType.SELECT,
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithoutOptions,
        'opt-1',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status configuration error: No option list defined')
    })

    it('should return error when options is empty array', async () => {
      const propertyWithEmptyOptions: PropertyDefinition = {
        id: 'select-prop',
        name: 'Status',
        type: PropertyType.SELECT,
        readonly: false,
        deletable: true,
        config: { options: [] },
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithEmptyOptions,
        'opt-1',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status configuration error: No option list defined')
    })

    it('should return valid for empty string value', async () => {
      const result = await processor.validateBusinessRules({ userId: 'user-1', workspaceId: 'ws-1' }, mockProperty, '')

      expect(result.valid).toBe(true)
    })

    it('should return valid for value in options list', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'opt-2',
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid for value not in options list', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'invalid-opt',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status value is not in the valid option list')
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

    it('should return empty object for empty string value', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, '', 123)

      expect(result).toEqual({})
    })

    it('should transform valid value to single value format', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 'opt-1', 456)

      expect(result.singleValues).toHaveLength(1)
      expect(result.singleValues![0]).toEqual({
        issue_id: 456,
        property_id: 'select-prop',
        property_type: PropertyType.SELECT,
        value: 'opt-1',
        number_value: null,
      })
    })

    it('should convert number value to string', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 123, 789)

      expect(result.singleValues![0].value).toBe('123')
    })
  })
})

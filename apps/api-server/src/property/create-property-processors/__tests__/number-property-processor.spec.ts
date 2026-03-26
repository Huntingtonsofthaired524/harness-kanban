import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { NumberPropertyProcessor } from '../number-property-processor'

describe('NumberPropertyProcessor', () => {
  let processor: NumberPropertyProcessor

  beforeEach(() => {
    processor = new NumberPropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'number-prop',
    name: 'Count',
    type: PropertyType.NUMBER,
    readonly: false,
    deletable: true,
  }

  describe('validateFormat', () => {
    it('should return valid for number value', () => {
      const result = processor.validateFormat(mockProperty, 42)

      expect(result.valid).toBe(true)
    })

    it('should return valid for zero value', () => {
      const result = processor.validateFormat(mockProperty, 0)

      expect(result.valid).toBe(true)
    })

    it('should return valid for negative number', () => {
      const result = processor.validateFormat(mockProperty, -10)

      expect(result.valid).toBe(true)
    })

    it('should return valid for decimal number', () => {
      const result = processor.validateFormat(mockProperty, 3.14)

      expect(result.valid).toBe(true)
    })

    it('should return invalid for string value', () => {
      const result = processor.validateFormat(mockProperty, '42')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be a number')
    })

    it('should return invalid for null value', () => {
      const result = processor.validateFormat(mockProperty, null)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be a number')
    })

    it('should return invalid for undefined value', () => {
      const result = processor.validateFormat(mockProperty, undefined)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be a number')
    })

    it('should return invalid for object value', () => {
      const result = processor.validateFormat(mockProperty, { value: 42 })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be a number')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid when no config provided', async () => {
      const result = await processor.validateBusinessRules({ userId: 'user-1', workspaceId: 'ws-1' }, mockProperty, 42)

      expect(result.valid).toBe(true)
    })

    it('should return valid when value is within min bound', async () => {
      const propertyWithMin: PropertyDefinition = {
        ...mockProperty,
        config: { min: 0 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithMin,
        5,
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when value is below min', async () => {
      const propertyWithMin: PropertyDefinition = {
        ...mockProperty,
        config: { min: 10 },
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithMin,
        5,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be greater than 10')
    })

    it('should return valid when value is within max bound', async () => {
      const propertyWithMax: PropertyDefinition = {
        ...mockProperty,
        config: { max: 100 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithMax,
        50,
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when value exceeds max', async () => {
      const propertyWithMax: PropertyDefinition = {
        ...mockProperty,
        config: { max: 100 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithMax,
        150,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be less than 100')
    })

    it('should return valid when value matches precision requirement', async () => {
      const propertyWithPrecision: PropertyDefinition = {
        ...mockProperty,
        config: { precision: 2 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithPrecision,
        3.14,
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for integer when precision is 0', async () => {
      const propertyWithPrecision: PropertyDefinition = {
        ...mockProperty,
        config: { precision: 0 },
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithPrecision,
        42,
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when decimal places exceed precision', async () => {
      const propertyWithPrecision: PropertyDefinition = {
        ...mockProperty,
        config: { precision: 2 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithPrecision,
        3.14159,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The precision must be 2 decimal places')
    })

    it('should validate all rules together', async () => {
      const propertyWithAllConstraints: PropertyDefinition = {
        ...mockProperty,
        config: { min: 0, max: 100, precision: 1 },
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        propertyWithAllConstraints,
        50.5,
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('transformToDbFormat', () => {
    it('should transform number to single value format with number_value', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 42, 123)

      expect(result.singleValues).toHaveLength(1)
      expect(result.singleValues![0]).toEqual({
        issue_id: 123,
        property_id: 'number-prop',
        property_type: PropertyType.NUMBER,
        value: null,
        number_value: 42,
      })
    })

    it('should handle negative numbers', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, -100, 456)

      expect(result.singleValues![0].number_value).toBe(-100)
    })

    it('should handle decimal numbers', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 3.14159, 789)

      expect(result.singleValues![0].number_value).toBe(3.14159)
    })

    it('should handle zero', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 0, 100)

      expect(result.singleValues![0].number_value).toBe(0)
    })
  })
})

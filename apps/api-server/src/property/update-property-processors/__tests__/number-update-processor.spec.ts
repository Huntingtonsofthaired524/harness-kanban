import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { NumberUpdatePropertyProcessor } from '../number-update-processor'

describe('NumberUpdatePropertyProcessor', () => {
  let processor: NumberUpdatePropertyProcessor

  beforeEach(() => {
    processor = new NumberUpdatePropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'number-prop',
    name: 'Count',
    type: PropertyType.NUMBER,
    readonly: false,
    deletable: true,
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  describe('validateFormat', () => {
    it('should return valid for SET operation with number value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 42,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with zero', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 0,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with negative number', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: -10,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with decimal', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 3.14,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for CLEAR operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(true)
    })

    it('should return invalid for SET operation with string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: '42',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })

    it('should return invalid for SET operation with null value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: null,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })

    it('should return invalid for unsupported operation type', () => {
      const result = processor.validateFormat(mockProperty, '2', { value: 42 })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid for CLEAR operation', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.CLEAR.toString(),
        {},
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid when no config provided', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 42 },
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid when value is within min bound', async () => {
      const propertyWithMin: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { min: 0 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithMin,
        CommonPropertyOperationType.SET.toString(),
        { value: 5 },
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when value is below min', async () => {
      const propertyWithMin: PropertyDefinition = {
        ...mockProperty,
        config: { min: 10 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithMin,
        CommonPropertyOperationType.SET.toString(),
        { value: 5 },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be greater than 10')
    })

    it('should return valid when value is within max bound', async () => {
      const propertyWithMax: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { max: 100 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithMax,
        CommonPropertyOperationType.SET.toString(),
        { value: 50 },
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when value exceeds max', async () => {
      const propertyWithMax: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { max: 100 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithMax,
        CommonPropertyOperationType.SET.toString(),
        { value: 150 },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The value must be less than 100')
    })

    it('should return valid when value matches precision requirement', async () => {
      const propertyWithPrecision: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { precision: 2 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithPrecision,
        CommonPropertyOperationType.SET.toString(),
        { value: 3.14 },
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when decimal places exceed precision', async () => {
      const propertyWithPrecision: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { precision: 2 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithPrecision,
        CommonPropertyOperationType.SET.toString(),
        { value: 3.14159 },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The precision must be 2 decimal places')
    })

    it('should validate all constraints together', async () => {
      const propertyWithAllConstraints: PropertyDefinition = {
        ...mockProperty,
        readonly: false,
        deletable: true,
        config: { min: 0, max: 100, precision: 1 },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithAllConstraints,
        CommonPropertyOperationType.SET.toString(),
        { value: 50.5 },
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('transformToDbOperations', () => {
    it('should transform SET operation to singleValueUpdate with number_value', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 42 },
        123,
      )

      expect(result.singleValueUpdate).toEqual({
        number_value: 42,
      })
      expect(result.singleValueClear).toBeUndefined()
    })

    it('should handle negative numbers', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: -100 },
        456,
      )

      expect(result.singleValueUpdate).toEqual({
        number_value: -100,
      })
    })

    it('should handle decimal numbers', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 3.14159 },
        789,
      )

      expect(result.singleValueUpdate).toEqual({
        number_value: 3.14159,
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

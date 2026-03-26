import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { SelectUpdatePropertyProcessor } from '../select-update-processor'

describe('SelectUpdatePropertyProcessor', () => {
  let processor: SelectUpdatePropertyProcessor

  beforeEach(() => {
    processor = new SelectUpdatePropertyProcessor()
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
        { id: 'opt-3', name: 'Option 3', color: '#0000ff' },
      ],
    },
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  describe('validateFormat', () => {
    it('should return valid for SET operation with string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 'opt-1',
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with null value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: null,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for CLEAR operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(true)
    })

    it('should return invalid for unsupported operation type', () => {
      const result = processor.validateFormat(mockProperty, '2', { value: 'opt-1' })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Select property does not support operation type: 2, only set and clear are supported',
      )
    })

    it('should return invalid when value field is missing in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {})

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('SET operation requires a value field')
    })

    it('should return invalid when value is number in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 123,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Select type value must be a string or null')
    })

    it('should return invalid when value is object in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: { id: 'opt-1' },
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Select type value must be a string or null')
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

    it('should return valid for SET operation with null value', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: null },
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for value in options list', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'opt-2' },
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when config is missing', async () => {
      const propertyWithoutConfig: PropertyDefinition = {
        id: 'select-prop',
        name: 'Status',
        type: PropertyType.SELECT,
        readonly: false,
        deletable: true,
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithoutConfig,
        CommonPropertyOperationType.SET.toString(),
        { value: 'opt-1' },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property config is missing options array')
    })

    it('should return invalid when options is not an array', async () => {
      const propertyWithInvalidConfig: PropertyDefinition = {
        id: 'select-prop',
        name: 'Status',
        type: PropertyType.SELECT,
        readonly: false,
        deletable: true,
        config: { options: 'not-an-array' },
      }

      const result = await processor.validateBusinessRules(
        mockContext,
        propertyWithInvalidConfig,
        CommonPropertyOperationType.SET.toString(),
        { value: 'opt-1' },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property config is missing options array')
    })

    it('should return invalid for value not in options list', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'invalid-opt' },
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('The selected value "invalid-opt" is not in the option list')
    })
  })

  describe('transformToDbOperations', () => {
    it('should transform SET operation to singleValueUpdate', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'opt-1' },
        123,
      )

      expect(result.singleValueUpdate).toEqual({
        value: 'opt-1',
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
        456,
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
        789,
      )

      expect(result.singleValueClear).toBe(true)
      expect(result.singleValueUpdate).toBeUndefined()
    })
  })
})

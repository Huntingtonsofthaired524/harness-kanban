import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DatetimeUpdatePropertyProcessor } from '../datetime-update-processor'

describe('DatetimeUpdatePropertyProcessor', () => {
  let processor: DatetimeUpdatePropertyProcessor

  beforeEach(() => {
    processor = new DatetimeUpdatePropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'datetime-prop',
    name: 'Due Date',
    type: PropertyType.DATETIME,
    readonly: false,
    deletable: true,
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  describe('validateFormat', () => {
    it('should return valid for SET operation with valid millisecond timestamp', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 1704067200000,
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for CLEAR operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(true)
    })

    it('should return invalid for SET operation with string value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: '2024-01-01',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })

    it('should return invalid for SET operation with null value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: null })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })

    it('should return invalid for SET operation with seconds timestamp (10 digits)', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 1704067200,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be milliseconds precision (13 digits)')
    })

    it('should return invalid for SET operation with microseconds timestamp (16 digits)', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: 1704067200000000,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be milliseconds precision (13 digits)')
    })

    it('should return invalid for unsupported operation type', () => {
      const result = processor.validateFormat(mockProperty, '2', { value: 1704067200000 })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid operation type or value format')
    })
  })

  describe('validateBusinessRules', () => {
    it('should always return valid', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 1704067200000 },
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('transformToDbOperations', () => {
    it('should transform SET operation to singleValueUpdate with ISO string and timestamp', async () => {
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC

      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: timestamp },
        123,
      )

      expect(result.singleValueUpdate).toEqual({
        value: '2024-01-01T00:00:00.000Z',
        number_value: timestamp,
      })
    })

    it('should handle current timestamp', async () => {
      const timestamp = 1712345678901

      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: timestamp },
        456,
      )

      expect(result.singleValueUpdate!.value).toBe(new Date(timestamp).toISOString())
      expect(result.singleValueUpdate!.number_value).toBe(timestamp)
    })

    it('should handle historical timestamp', async () => {
      const timestamp = 0 // Unix epoch

      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: timestamp },
        789,
      )

      expect(result.singleValueUpdate!.value).toBe('1970-01-01T00:00:00.000Z')
      expect(result.singleValueUpdate!.number_value).toBe(timestamp)
    })
  })
})

import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { DatetimePropertyProcessor } from '../datetime-property-processor'

describe('DatetimePropertyProcessor', () => {
  let processor: DatetimePropertyProcessor

  beforeEach(() => {
    processor = new DatetimePropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'datetime-prop',
    name: 'Due Date',
    type: PropertyType.DATETIME,
    readonly: false,
    deletable: true,
  }

  describe('validateFormat', () => {
    it('should return valid for valid millisecond timestamp (13 digits)', () => {
      const timestamp = Date.now() // Current timestamp in milliseconds
      const result = processor.validateFormat(mockProperty, timestamp)

      expect(result.valid).toBe(true)
    })

    it('should return valid for specific 13-digit timestamp', () => {
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC
      const result = processor.validateFormat(mockProperty, timestamp)

      expect(result.valid).toBe(true)
    })

    it('should return invalid for string value', () => {
      const result = processor.validateFormat(mockProperty, '2024-01-01')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be a number')
    })

    it('should return invalid for null value', () => {
      const result = processor.validateFormat(mockProperty, null)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be a number')
    })

    it('should return invalid for undefined value', () => {
      const result = processor.validateFormat(mockProperty, undefined)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be a number')
    })

    it('should return invalid for seconds timestamp (10 digits)', () => {
      const secondsTimestamp = 1704067200 // 10 digits
      const result = processor.validateFormat(mockProperty, secondsTimestamp)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be milliseconds precision (13 digits)')
    })

    it('should return invalid for microseconds timestamp (16 digits)', () => {
      const microTimestamp = 1704067200000000 // 16 digits
      const result = processor.validateFormat(mockProperty, microTimestamp)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be milliseconds precision (13 digits)')
    })

    it('should return invalid for very short timestamp', () => {
      const result = processor.validateFormat(mockProperty, 12345)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Datetime must be milliseconds precision (13 digits)')
    })
  })

  describe('validateBusinessRules', () => {
    it('should always return valid', async () => {
      const timestamp = Date.now()

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        timestamp,
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for any timestamp', async () => {
      const pastTimestamp = 0 // 1970-01-01

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        pastTimestamp,
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('transformToDbFormat', () => {
    it('should transform timestamp to ISO string and store both', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC

      const result = await processor.transformToDbFormat(context, mockProperty, timestamp, 123)

      expect(result.singleValues).toHaveLength(1)
      expect(result.singleValues![0]).toEqual({
        issue_id: 123,
        property_id: 'datetime-prop',
        property_type: PropertyType.DATETIME,
        value: '2024-01-01T00:00:00.000Z',
        number_value: timestamp,
      })
    })

    it('should handle current timestamp', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }
      const timestamp = 1712345678901

      const result = await processor.transformToDbFormat(context, mockProperty, timestamp, 456)

      expect(result.singleValues![0].value).toBe(new Date(timestamp).toISOString())
      expect(result.singleValues![0].number_value).toBe(timestamp)
    })

    it('should handle historical timestamp', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }
      const timestamp = 0 // Unix epoch

      const result = await processor.transformToDbFormat(context, mockProperty, timestamp, 789)

      expect(result.singleValues![0].value).toBe('1970-01-01T00:00:00.000Z')
      expect(result.singleValues![0].number_value).toBe(0)
    })
  })
})

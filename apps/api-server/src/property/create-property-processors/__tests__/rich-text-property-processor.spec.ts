import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { RichTextPropertyProcessor } from '../rich-text-property-processor'

describe('RichTextPropertyProcessor', () => {
  let processor: RichTextPropertyProcessor

  beforeEach(() => {
    processor = new RichTextPropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'rich-text-prop',
    name: 'Description',
    type: PropertyType.RICH_TEXT,
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

    it('should return valid for string value', () => {
      const result = processor.validateFormat(mockProperty, 'Some text content')

      expect(result.valid).toBe(true)
    })

    it('should return valid for empty string', () => {
      const result = processor.validateFormat(mockProperty, '')

      expect(result.valid).toBe(true)
    })

    it('should return valid for number value (convertible to string)', () => {
      const result = processor.validateFormat(mockProperty, 12345)

      expect(result.valid).toBe(true)
    })

    it('should return valid for object with toString method', () => {
      const obj = {
        toString: () => 'object as string',
      }
      const result = processor.validateFormat(mockProperty, obj)

      expect(result.valid).toBe(true)
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid for null value', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        null,
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for undefined value', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        undefined,
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for short string', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'Short text',
      )

      expect(result.valid).toBe(true)
    })

    it('should return valid for string at max length (10000)', async () => {
      const longText = 'A'.repeat(10000)

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        longText,
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid for string exceeding max length (10000)', async () => {
      const tooLongText = 'A'.repeat(10001)

      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        tooLongText,
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Description length cannot exceed 10000 characters')
    })

    it('should handle number value by converting to string for length check', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        12345,
      )

      expect(result.valid).toBe(true)
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

    it('should transform string to single value format', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 'Rich text content', 456)

      expect(result.singleValues).toHaveLength(1)
      expect(result.singleValues![0]).toEqual({
        issue_id: 456,
        property_id: 'rich-text-prop',
        property_type: PropertyType.RICH_TEXT,
        value: 'Rich text content',
        number_value: null,
      })
    })

    it('should convert number to string', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, 12345, 789)

      expect(result.singleValues![0].value).toBe('12345')
    })

    it('should handle empty string', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }

      const result = await processor.transformToDbFormat(context, mockProperty, '', 100)

      expect(result.singleValues![0].value).toBe('')
    })

    it('should handle HTML content', async () => {
      const context = { userId: 'user-1', workspaceId: 'ws-1' }
      const htmlContent = '<p>Paragraph with <strong>bold</strong> text</p>'

      const result = await processor.transformToDbFormat(context, mockProperty, htmlContent, 200)

      expect(result.singleValues![0].value).toBe(htmlContent)
    })
  })
})

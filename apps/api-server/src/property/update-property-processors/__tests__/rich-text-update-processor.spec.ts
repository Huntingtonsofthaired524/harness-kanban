import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { RichTextUpdatePropertyProcessor } from '../rich-text-update-processor'

describe('RichTextUpdatePropertyProcessor', () => {
  let processor: RichTextUpdatePropertyProcessor

  beforeEach(() => {
    processor = new RichTextUpdatePropertyProcessor()
  })

  const mockProperty: PropertyDefinition = {
    id: 'rich-text-prop',
    name: 'Description',
    type: PropertyType.RICH_TEXT,
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
        value: 'Rich text content',
      })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with null value', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: null })

      expect(result.valid).toBe(true)
    })

    it('should return valid for SET operation with empty string', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: '' })

      expect(result.valid).toBe(true)
    })

    it('should return valid for CLEAR operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

      expect(result.valid).toBe(true)
    })

    it('should return invalid for unsupported operation type', () => {
      const result = processor.validateFormat(mockProperty, '2', { value: 'content' })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Rich text property does not support operation type: 2, only set and clear are supported',
      )
    })

    it('should return invalid when value field is missing in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {})

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('SET operation requires a value field')
    })

    it('should return invalid when value is number in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), { value: 123 })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Rich text property value must be a string or null')
    })

    it('should return invalid when value is object in SET operation', () => {
      const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
        value: { text: 'content' },
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Rich text property value must be a string or null')
    })
  })

  describe('validateBusinessRules', () => {
    it('should always return valid', async () => {
      const result = await processor.validateBusinessRules(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'any content' },
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('transformToDbOperations', () => {
    it('should transform SET operation to singleValueUpdate', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: 'Rich text content' },
        123,
      )

      expect(result.singleValueUpdate).toEqual({
        value: 'Rich text content',
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

    it('should handle HTML content', async () => {
      const htmlContent = '<p>Paragraph with <strong>bold</strong> text</p>'

      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: htmlContent },
        789,
      )

      expect(result.singleValueUpdate!.value).toBe(htmlContent)
    })

    it('should handle empty string', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.SET.toString(),
        { value: '' },
        100,
      )

      expect(result.singleValueUpdate!.value).toBe('')
    })

    it('should transform CLEAR operation to singleValueClear', async () => {
      const result = await processor.transformToDbOperations(
        mockContext,
        mockProperty,
        CommonPropertyOperationType.CLEAR.toString(),
        {},
        200,
      )

      expect(result.singleValueClear).toBe(true)
      expect(result.singleValueUpdate).toBeUndefined()
    })
  })
})

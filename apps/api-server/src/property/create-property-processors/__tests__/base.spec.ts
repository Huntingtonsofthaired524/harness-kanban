import { PropertyType } from '@repo/shared/property/constants'
import { DbInsertData } from '../../types/property.types'
import { BasePropertyProcessor } from '../base'

// Concrete processor used to exercise the base class behavior in tests.
class TestPropertyProcessor extends BasePropertyProcessor {
  validateFormat(): { valid: boolean; errors?: string[] } {
    return { valid: true }
  }

  async validateBusinessRules(): Promise<{ valid: boolean; errors?: string[] }> {
    return { valid: true }
  }

  async transformToDbFormat(): Promise<DbInsertData> {
    return { singleValues: [] }
  }
}

describe('BasePropertyProcessor', () => {
  let processor: TestPropertyProcessor

  beforeEach(() => {
    processor = new TestPropertyProcessor()
  })

  describe('createSingleValue', () => {
    it('should create single value with string value', () => {
      const result = processor['createSingleValue'](1, 'prop-1', PropertyType.TITLE, 'test value', null)

      expect(result).toEqual({
        issue_id: 1,
        property_id: 'prop-1',
        property_type: PropertyType.TITLE,
        value: 'test value',
        number_value: null,
      })
    })

    it('should create single value with number value', () => {
      const result = processor['createSingleValue'](2, 'prop-2', PropertyType.NUMBER, null, 42)

      expect(result).toEqual({
        issue_id: 2,
        property_id: 'prop-2',
        property_type: PropertyType.NUMBER,
        value: null,
        number_value: 42,
      })
    })

    it('should create single value with both values null', () => {
      const result = processor['createSingleValue'](3, 'prop-3', PropertyType.SELECT, null, null)

      expect(result).toEqual({
        issue_id: 3,
        property_id: 'prop-3',
        property_type: PropertyType.SELECT,
        value: null,
        number_value: null,
      })
    })
  })

  describe('createMultiValue', () => {
    it('should create multi value with string value', () => {
      const result = processor['createMultiValue'](1, 'prop-1', PropertyType.SELECT, 0, 'value1', null)

      expect(result).toEqual({
        issue_id: 1,
        property_id: 'prop-1',
        property_type: PropertyType.SELECT,
        value: 'value1',
        number_value: null,
        position: 0,
        extra: undefined,
      })
    })

    it('should create multi value with number value', () => {
      const result = processor['createMultiValue'](2, 'prop-2', PropertyType.NUMBER, 1, null, 100, { key: 'value' })

      expect(result).toEqual({
        issue_id: 2,
        property_id: 'prop-2',
        property_type: PropertyType.NUMBER,
        value: null,
        number_value: 100,
        position: 1,
        extra: { key: 'value' },
      })
    })

    it('should create multi value without extra', () => {
      const result = processor['createMultiValue'](3, 'prop-3', PropertyType.USER, 2, 'user-id', null)

      expect(result).toEqual({
        issue_id: 3,
        property_id: 'prop-3',
        property_type: PropertyType.USER,
        value: 'user-id',
        number_value: null,
        position: 2,
      })
      expect(result.extra).toBeUndefined()
    })
  })
})

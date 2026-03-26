import { ActivityType } from '@repo/shared/issue/constants'
import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { BaseUpdatePropertyProcessor } from '../base'

// Create a concrete test implementation
class TestUpdatePropertyProcessor extends BaseUpdatePropertyProcessor {
  validateFormat(): { valid: boolean; errors?: string[] } {
    return { valid: true }
  }

  async validateBusinessRules(): Promise<{ valid: boolean; errors?: string[] }> {
    return { valid: true }
  }

  async transformToDbOperations(): Promise<{
    singleValueClear?: boolean
    singleValueUpdate?: { value?: string | null; number_value?: number | null }
  }> {
    return {}
  }
}

describe('BaseUpdatePropertyProcessor', () => {
  let processor: TestUpdatePropertyProcessor

  beforeEach(() => {
    processor = new TestUpdatePropertyProcessor()
  })

  const mockProperty = {
    id: 'prop-1',
    name: 'Test Property',
    type: PropertyType.TITLE,
    readonly: false,
    deletable: true,
  }

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
  }

  describe('valueChanged', () => {
    describe('CLEAR operation', () => {
      it('should return true when original value is not null', () => {
        const result = processor.valueChanged(
          'original value',
          mockProperty,
          CommonPropertyOperationType.CLEAR.toString(),
          {},
        )

        expect(result).toBe(true)
      })

      it('should return false when original value is null', () => {
        const result = processor.valueChanged(null, mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

        expect(result).toBe(false)
      })

      it('should return true when original value is number 0', () => {
        const result = processor.valueChanged(0, mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

        expect(result).toBe(true)
      })

      it('should return true when original value is empty string', () => {
        const result = processor.valueChanged('', mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

        expect(result).toBe(true)
      })
    })

    describe('SET operation', () => {
      it('should return true when original is null and new value is not null', () => {
        const result = processor.valueChanged(null, mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 'new value',
        })

        expect(result).toBe(true)
      })

      it('should return true when original is not null and new value is null', () => {
        const result = processor.valueChanged(
          'original value',
          mockProperty,
          CommonPropertyOperationType.SET.toString(),
          { value: null },
        )

        expect(result).toBe(true)
      })

      it('should return false when both original and new value are null', () => {
        const result = processor.valueChanged(null, mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: null,
        })

        expect(result).toBe(false)
      })

      it('should return true when string values are different', () => {
        const result = processor.valueChanged('old value', mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 'new value',
        })

        expect(result).toBe(true)
      })

      it('should return false when string values are the same', () => {
        const result = processor.valueChanged('same value', mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 'same value',
        })

        expect(result).toBe(false)
      })

      it('should return true when number values are different', () => {
        const result = processor.valueChanged(10, mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 20,
        })

        expect(result).toBe(true)
      })

      it('should return false when number values are the same', () => {
        const result = processor.valueChanged(42, mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 42,
        })

        expect(result).toBe(false)
      })

      it('should return true when types are different (string vs number)', () => {
        const result = processor.valueChanged('42', mockProperty, CommonPropertyOperationType.SET.toString(), {
          value: 42,
        })

        expect(result).toBe(true)
      })

      describe('array comparisons', () => {
        it('should return true when array lengths differ', () => {
          const result = processor.valueChanged(['a', 'b'], mockProperty, CommonPropertyOperationType.SET.toString(), {
            value: ['a', 'b', 'c'],
          })

          expect(result).toBe(true)
        })

        it('should return false when arrays have same elements', () => {
          const result = processor.valueChanged(
            ['a', 'b', 'c'],
            mockProperty,
            CommonPropertyOperationType.SET.toString(),
            { value: ['a', 'b', 'c'] },
          )

          expect(result).toBe(false)
        })

        it('should return true when array elements differ', () => {
          const result = processor.valueChanged(['a', 'b'], mockProperty, CommonPropertyOperationType.SET.toString(), {
            value: ['a', 'c'],
          })

          expect(result).toBe(true)
        })

        it('should return true when element order differs', () => {
          const result = processor.valueChanged(['a', 'b'], mockProperty, CommonPropertyOperationType.SET.toString(), {
            value: ['b', 'a'],
          })

          expect(result).toBe(true)
        })
      })

      it('should throw error when payload has no value field', () => {
        expect(() =>
          processor.valueChanged('original', mockProperty, CommonPropertyOperationType.SET.toString(), {}),
        ).toThrow('Unexpected common operation payload')
      })
    })

    describe('unsupported operation', () => {
      it('should throw error for unsupported operation type', () => {
        expect(() => processor.valueChanged('original', mockProperty, 'UNSUPPORTED_OP', {})).toThrow(
          'Unexpected common operation type',
        )
      })
    })
  })

  describe('generateActivity', () => {
    describe('SET operation', () => {
      it('should generate SET_PROPERTY_VALUE activity', () => {
        const result = processor.generateActivity(
          mockContext,
          mockProperty,
          CommonPropertyOperationType.SET.toString(),
          { value: 'new value' },
          123,
        )

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          issueId: 123,
          type: ActivityType.SET_PROPERTY_VALUE,
          payload: {
            userId: 'user-1',
            propertyId: 'prop-1',
            propertyType: PropertyType.TITLE,
            propertyName: 'Test Property',
            newValue: 'new value',
          },
          createdBy: 'user-1',
        })
      })

      it('should handle null value in SET operation', () => {
        const result = processor.generateActivity(
          mockContext,
          mockProperty,
          CommonPropertyOperationType.SET.toString(),
          { value: null },
          456,
        )

        expect(result[0].payload.newValue).toBeNull()
      })

      it('should handle number value in SET operation', () => {
        const result = processor.generateActivity(
          mockContext,
          mockProperty,
          CommonPropertyOperationType.SET.toString(),
          { value: 42 },
          789,
        )

        expect(result[0].payload.newValue).toBe(42)
      })
    })

    describe('CLEAR operation', () => {
      it('should generate CLEAR_PROPERTY_VALUE activity', () => {
        const result = processor.generateActivity(
          mockContext,
          mockProperty,
          CommonPropertyOperationType.CLEAR.toString(),
          {},
          123,
        )

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          issueId: 123,
          type: ActivityType.CLEAR_PROPERTY_VALUE,
          payload: {
            userId: 'user-1',
            propertyId: 'prop-1',
            propertyType: PropertyType.TITLE,
            propertyName: 'Test Property',
          },
          createdBy: 'user-1',
        })
      })
    })

    describe('unsupported operation', () => {
      it('should return empty array for unsupported operation', () => {
        const result = processor.generateActivity(mockContext, mockProperty, 'UNSUPPORTED_OP', {}, 123)

        expect(result).toEqual([])
      })
    })
  })
})

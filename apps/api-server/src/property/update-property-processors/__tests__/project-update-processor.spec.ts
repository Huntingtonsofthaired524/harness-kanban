import { CommonPropertyOperationType, PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { ProjectUpdatePropertyProcessor } from '../project-update-processor'

describe('ProjectUpdatePropertyProcessor', () => {
  const processor = new ProjectUpdatePropertyProcessor()

  const mockProperty: PropertyDefinition = {
    id: 'project-prop',
    name: 'Project',
    type: PropertyType.PROJECT,
    readonly: false,
    deletable: false,
  }

  it('rejects SET operations because project reassignment is immutable', () => {
    const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.SET.toString(), {
      value: 'project-123',
    })

    expect(result).toEqual({
      valid: false,
      errors: ['Project cannot be changed after issue creation'],
    })
  })

  it('rejects CLEAR operations because project reassignment is immutable', () => {
    const result = processor.validateFormat(mockProperty, CommonPropertyOperationType.CLEAR.toString(), {})

    expect(result).toEqual({
      valid: false,
      errors: ['Project cannot be changed after issue creation'],
    })
  })

  it('still reports unsupported operation types explicitly', () => {
    const result = processor.validateFormat(mockProperty, 'append', {})

    expect(result).toEqual({
      valid: false,
      errors: ['Operation: append not supported'],
    })
  })
})

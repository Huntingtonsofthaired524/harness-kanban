import { PropertyType } from '@repo/shared/property/constants'
import { PropertyDefinition } from '@repo/shared/property/types'
import { StatusPropertyProcessor } from '../status-property-processor'

describe('StatusPropertyProcessor', () => {
  let processor: StatusPropertyProcessor

  const mockProperty: PropertyDefinition = {
    id: 'status-prop',
    name: 'Status',
    type: PropertyType.STATUS,
    readonly: false,
    deletable: false,
    config: {
      initialStatusId: 'todo',
      statuses: [
        { id: 'todo', label: 'Todo', icon: 'Circle' },
        { id: 'in_progress', label: 'In progress', icon: 'Hammer' },
        { id: 'completed', label: 'Completed', icon: 'BadgeCheck' },
      ],
      transitions: {
        todo: [{ toStatusId: 'in_progress', actionLabel: 'Start work' }],
        in_progress: [{ toStatusId: 'completed', actionLabel: 'Complete' }],
        completed: [],
      },
    },
  }

  beforeEach(() => {
    processor = new StatusPropertyProcessor()
  })

  describe('validateFormat', () => {
    it('should return valid for a non-empty string', () => {
      const result = processor.validateFormat(mockProperty, 'todo')

      expect(result.valid).toBe(true)
    })

    it('should return invalid for an empty string', () => {
      const result = processor.validateFormat(mockProperty, '')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status must be a non-empty string')
    })

    it('should return invalid for a non-string value', () => {
      const result = processor.validateFormat(mockProperty, 123)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status must be a non-empty string')
    })
  })

  describe('validateBusinessRules', () => {
    it('should return valid when the status exists in config', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'in_progress',
      )

      expect(result.valid).toBe(true)
    })

    it('should return invalid when config is missing', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        {
          ...mockProperty,
          config: undefined,
        },
        'todo',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status configuration error: Invalid status config')
    })

    it('should return invalid when the status does not exist in config', async () => {
      const result = await processor.validateBusinessRules(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'queued',
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property Status value is not in the valid status list')
    })
  })

  describe('transformToDbFormat', () => {
    it('should persist the status as a single status value', async () => {
      const result = await processor.transformToDbFormat(
        { userId: 'user-1', workspaceId: 'ws-1' },
        mockProperty,
        'todo',
        123,
      )

      expect(result.singleValues).toEqual([
        {
          issue_id: 123,
          property_id: 'status-prop',
          property_type: PropertyType.STATUS,
          value: 'todo',
          number_value: null,
        },
      ])
    })
  })
})

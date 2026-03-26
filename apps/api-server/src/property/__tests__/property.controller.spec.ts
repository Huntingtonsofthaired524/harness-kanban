import { PropertyController } from '../property.controller'
import { PropertyService } from '../property.service'

describe('PropertyController', () => {
  let controller: PropertyController
  let propertyService: jest.Mocked<PropertyService>

  beforeEach(() => {
    propertyService = {
      getPropertyDefinitions: jest.fn(),
    } as unknown as jest.Mocked<PropertyService>

    controller = new PropertyController(propertyService)
  })

  describe('getProperties', () => {
    it('should return property definitions', async () => {
      const mockProperties = [
        { id: 'prop-1', name: 'Title', type: 'title' },
        { id: 'prop-2', name: 'Status', type: 'status' },
      ]
      propertyService.getPropertyDefinitions.mockResolvedValue(mockProperties as any)

      const result = await controller.getProperties()

      expect(propertyService.getPropertyDefinitions).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ properties: mockProperties })
    })

    it('should handle empty properties', async () => {
      propertyService.getPropertyDefinitions.mockResolvedValue([])

      const result = await controller.getProperties()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ properties: [] })
    })

    it('should handle properties with config', async () => {
      const mockProperties = [
        {
          id: 'status',
          name: 'Status',
          type: 'status',
          config: {
            initialStatusId: 'todo',
            statuses: [
              { id: 'todo', label: 'Todo', icon: 'Circle' },
              { id: 'completed', label: 'Completed', icon: 'BadgeCheck' },
            ],
          },
        },
      ]
      propertyService.getPropertyDefinitions.mockResolvedValue(mockProperties as any)

      const result = await controller.getProperties()

      expect(result.data!.properties).toHaveLength(1)
      expect(result.data!.properties[0].config.statuses).toHaveLength(2)
    })
  })
})

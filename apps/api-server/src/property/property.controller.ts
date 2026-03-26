import { makeSuccessResponse } from '@/common/responses/api-response'
import { Controller, Get } from '@nestjs/common'
import { PropertyService } from './property.service'
import type { ApiResponse } from '@/common/responses/api-response'

@Controller('api/v1/properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  async getProperties(): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getPropertyDefinitions()

    return makeSuccessResponse({
      properties,
    })
  }
}

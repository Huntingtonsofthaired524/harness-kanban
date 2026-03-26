import { Request } from 'express'

import { OpenApiService } from '@/openapi/openapi.service'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class OpenApiAuthGuard implements CanActivate {
  constructor(private readonly openapiService: OpenApiService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const authContext = await this.openapiService.validateOpenApiRequestAndGetContext(request)

    if (!authContext) {
      throw new UnauthorizedException('Unauthorized OpenAPI request')
    }

    // attach user to the request object
    request.user = authContext.user

    return true
  }
}

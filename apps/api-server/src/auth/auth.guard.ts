import { Request } from 'express'

import { AuthService } from '@/auth/auth.service'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // const request = context.switchToHttp().getRequest<Request>()

    // const authContext = await this.authService.validateRequestAndGetContext(request)

    // if (!authContext) {
    //   throw new UnauthorizedException('Unauthorized request')
    // }

    // attach user and organization to the request object
    // request.user = authContext.user
    // request.organization = authContext.organization || undefined

    return true
  }
}

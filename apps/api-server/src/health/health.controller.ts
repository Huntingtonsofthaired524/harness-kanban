import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { PrismaHealthIndicator } from './prisma.health'

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @AllowAnonymous()
  @HealthCheck()
  async check() {
    return this.healthCheckService.check([() => this.prismaIndicator.checkDatabase()])
  }
}

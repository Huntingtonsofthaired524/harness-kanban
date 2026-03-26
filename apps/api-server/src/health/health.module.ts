import { Module } from '@nestjs/common'
import { HealthIndicatorService, TerminusModule } from '@nestjs/terminus'
import { HealthController } from './health.controller'
import { PrismaHealthIndicator } from './prisma.health'

@Module({
  imports: [TerminusModule],
  providers: [HealthIndicatorService, PrismaHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}

import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly health: HealthIndicatorService,
  ) {}

  async checkDatabase() {
    const indicator = this.health.check('database')
    try {
      await this.prisma.client.$queryRaw`SELECT 1`
      return indicator.up()
    } catch {
      return indicator.down('unable to query database')
    }
  }
}

import { Injectable } from '@nestjs/common'
import { prisma } from '@repo/database'

@Injectable()
export class PrismaService {
  get client() {
    return prisma
  }
}

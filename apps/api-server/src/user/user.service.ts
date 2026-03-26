import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { BOT_PREFIX } from './constants/user.constants'
import { User } from './types/user.types'

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailableUsers(_workspaceId: string): Promise<User[]> {
    // Get all users from database only
    const dbUsers = await this.prismaService.client.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
    })

    return dbUsers.map(user => ({
      id: user.id,
      username: user.name,
      imageUrl: user.image || '',
      hasImage: !!user.image,
    }))
  }

  async getSpecifiedUsers(userIds: string[]): Promise<User[]> {
    // Get all users from database only
    const dbUsers = await this.prismaService.client.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        image: true,
      },
    })

    return dbUsers.map(user => ({
      id: user.id,
      username: user.name,
      imageUrl: user.image || '',
      hasImage: !!user.image,
    }))
  }

  async checkUserExists(userId: string): Promise<boolean> {
    // Check if user exists in database
    const userCount = await this.prismaService.client.user.count({
      where: {
        id: userId,
      },
    })
    return userCount > 0
  }
}

export const isBotUser = (userId: string): boolean => {
  return userId.startsWith(BOT_PREFIX)
}

import { AuthWorkspaceId } from '@/auth/decorators/organization.decorator'
import { makeSuccessResponse } from '@/common/responses/api-response'
import { User } from '@/user/types/user.types'
import { UserService } from '@/user/user.service'
import { Controller, Get, Query } from '@nestjs/common'

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@AuthWorkspaceId() workspaceId: string, @Query('userIds') userIds?: string | string[]) {
    const processedUserIds: string[] = userIds ? (Array.isArray(userIds) ? userIds : [userIds]) : []

    let users: User[] = []
    if (processedUserIds.length === 0) {
      users = await this.userService.getAvailableUsers(workspaceId)
    } else {
      users = await this.userService.getSpecifiedUsers(processedUserIds)
    }

    return makeSuccessResponse({
      users,
    })
  }
}

import { AuthModule } from '@/auth/auth.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { UserController } from './user.controller'

@Module({
  imports: [AuthModule, UserModule],
  controllers: [UserController],
})
export class UserApiModule {}

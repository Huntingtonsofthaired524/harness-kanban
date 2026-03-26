import { DatabaseModule } from '@/database/database.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UserService } from './user.service'

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

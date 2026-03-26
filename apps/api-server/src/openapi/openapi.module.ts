import { AuthModule } from '@/auth/auth.module'
import { DatabaseModule } from '@/database/database.module'
import { IssueModule } from '@/issue/issue.module'
import { OpenApiAuthGuard } from '@/openapi/openapi.guard'
import { PropertyModule } from '@/property/property.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { OpenApiController } from './openapi.controller'
import { OpenApiService } from './openapi.service'

@Module({
  imports: [UserModule, AuthModule, DatabaseModule, PropertyModule, IssueModule],
  controllers: [OpenApiController],
  providers: [OpenApiService, OpenApiAuthGuard],
  exports: [OpenApiService, OpenApiAuthGuard],
})
export class OpenApiModule {}

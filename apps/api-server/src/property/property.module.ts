import { AuthModule } from '@/auth/auth.module'
import { ProjectModule } from '@/project/project.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { PropertyImplRegistry } from './impl-registry.service'
import { PropertyController } from './property.controller'
import { propertyImplProviders } from './property.providers'
import { PropertyService } from './property.service'

@Module({
  imports: [AuthModule, UserModule, ProjectModule],
  controllers: [PropertyController],
  providers: [PropertyService, PropertyImplRegistry, ...propertyImplProviders()],
  exports: [PropertyService, PropertyImplRegistry],
})
export class PropertyModule {}

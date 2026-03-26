import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { PropertyType } from '@repo/shared/property/constants'
import { RegistryName } from './constants/registry.constants'

@Injectable()
export class PropertyImplRegistry {
  constructor(private readonly moduleRef: ModuleRef) {}

  getImpl<T>(registryName: RegistryName, propertyType: PropertyType): T {
    return this.moduleRef.get<T>(`${registryName}-${propertyType}`, { strict: false })
  }
}

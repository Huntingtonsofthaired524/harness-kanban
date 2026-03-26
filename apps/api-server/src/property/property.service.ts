import { PrismaService } from '@/database/prisma.service'
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { SystemPropertyId } from '@repo/shared/property/constants'
import { getStatusPropertyConfig } from '@repo/shared/property/status-config'
import { PropertyDefinition } from '@repo/shared/property/types'

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPropertyDefinitions(): Promise<PropertyDefinition[]> {
    try {
      const properties = await this.prisma.client.property.findMany({
        where: {
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          config: true,
          readonly: true,
          deletable: true,
        },
      })

      const result = properties.map(prop => ({
        id: prop.id,
        name: prop.name,
        description: prop.description || undefined,
        type: prop.type,
        config: prop.config as Record<string, unknown> | undefined,
        readonly: prop.readonly,
        deletable: prop.deletable,
      })) as PropertyDefinition[]

      const propertyPriorityOrder = [
        SystemPropertyId.ID,
        SystemPropertyId.TITLE,
        SystemPropertyId.STATUS,
        SystemPropertyId.PROJECT,
        SystemPropertyId.PRIORITY,
        SystemPropertyId.ASSIGNEE,
        SystemPropertyId.REPORTER,
        SystemPropertyId.CREATED_AT,
        SystemPropertyId.UPDATED_AT,
      ]

      result.sort((a, b) => {
        const indexA = propertyPriorityOrder.indexOf(a.id as SystemPropertyId)
        const indexB = propertyPriorityOrder.indexOf(b.id as SystemPropertyId)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      })

      return result
    } catch (error) {
      console.error('Failed to get property definitions:', error)
      throw new InternalServerErrorException('Failed to get property definitions')
    }
  }

  async getPropertyDefinition(propertyId: string): Promise<PropertyDefinition | null> {
    try {
      const prop = await this.prisma.client.property.findFirst({
        where: {
          id: propertyId,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          config: true,
          readonly: true,
          deletable: true,
        },
      })

      if (!prop) {
        return null
      }

      return {
        id: prop.id,
        name: prop.name,
        description: prop.description || undefined,
        type: prop.type,
        config: prop.config as Record<string, unknown> | undefined,
        readonly: prop.readonly,
        deletable: prop.deletable,
      } satisfies PropertyDefinition
    } catch (error) {
      console.error('Failed to get property definition:', error)
      throw new InternalServerErrorException('Failed to get property definition')
    }
  }

  async getStatusPropertyDefinition(): Promise<PropertyDefinition> {
    const property = await this.getPropertyDefinition(SystemPropertyId.STATUS)
    if (!property) {
      throw new NotFoundException('Status property not found')
    }

    return property
  }

  async getStatusPropertyConfig() {
    const property = await this.getStatusPropertyDefinition()
    const config = getStatusPropertyConfig(property)
    if (!config) {
      throw new BadRequestException('Status property config is invalid')
    }

    return config
  }

  getInitialStatusId(properties: PropertyDefinition[]): string {
    const statusProperty = properties.find(property => property.id === SystemPropertyId.STATUS)
    if (!statusProperty) {
      throw new BadRequestException('Status property not found')
    }

    const config = getStatusPropertyConfig(statusProperty)
    if (!config) {
      throw new BadRequestException('Status property config is invalid')
    }

    return config.initialStatusId
  }

  async getFieldToPropertyMapping(): Promise<Map<string, { propertyId: string; propertyType: string }>> {
    try {
      const properties = await this.prisma.client.property.findMany({
        where: {
          deleted_at: null,
          alias: { not: null },
        },
        select: {
          id: true,
          alias: true,
          type: true,
        },
      })

      const mapping = new Map<string, { propertyId: string; propertyType: string }>()

      for (const prop of properties) {
        if (prop.alias) {
          mapping.set(prop.alias, {
            propertyId: prop.id,
            propertyType: prop.type,
          })
        }
      }

      return mapping
    } catch (error) {
      console.error('Failed to get field to property mapping:', error)
      throw new InternalServerErrorException('Failed to get field to property mapping')
    }
  }
}

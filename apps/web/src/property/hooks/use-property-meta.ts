import { useMemo } from 'react'

import { getPropertyMeta } from '@/property/registry/property-registry'
import { sortPropertyMetas } from '@/property/utils/sort-property-metas'
import { PropertyDefinition as ServerProperty } from '@repo/shared/property/types'
import { PropertyMeta } from '../types/property-types'

/**
 * use client-side property meta with server properties
 */
export const usePropertyMeta = (serverProperties: ServerProperty[]): PropertyMeta[] => {
  return useMemo(() => {
    const merged = serverProperties.flatMap(prop => {
      const clientPropertyMeta = getPropertyMeta(prop.id)
      if (!clientPropertyMeta) return []

      const mergedMeta: PropertyMeta = {
        ...clientPropertyMeta,
        config: prop.config,
        core: {
          ...clientPropertyMeta.core,
          propertyId: prop.id,
          type: clientPropertyMeta.core.type ?? (prop.type as PropertyMeta['core']['type']),
        },
        display: {
          ...clientPropertyMeta.display,
          label: clientPropertyMeta.display?.label ?? prop.name,
          description: clientPropertyMeta.display?.description ?? prop.description,
        },
      }

      return [mergedMeta]
    })

    return sortPropertyMetas(merged)
  }, [serverProperties])
}

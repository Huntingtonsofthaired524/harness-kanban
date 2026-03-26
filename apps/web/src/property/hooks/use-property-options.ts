import { getPropertyRendererEntry } from '@/property/registry/property-registry'
import { PropertyOptionItem } from '@/property/types/property-types'
import { useQuery } from '@tanstack/react-query'

export const usePropertyOptions = (propertyId: string) => {
  return useQuery<PropertyOptionItem[]>({
    queryKey: ['property-options', propertyId],
    queryFn: async () => {
      const entry = getPropertyRendererEntry(propertyId)
      const loader = entry?.optionsLoader

      if (typeof loader !== 'function') return []
      const result = await loader()
      return Array.isArray(result) ? result : []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

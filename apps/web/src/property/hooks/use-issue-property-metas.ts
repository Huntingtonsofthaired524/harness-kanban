import { useServerProperties } from '@/property/hooks/use-properties'
import { usePropertyMeta } from '@/property/hooks/use-property-meta'
import { PropertyMeta } from '@/property/types/property-types'

export const useIssuePropertyMetas = (): PropertyMeta[] => {
  const { properties = [] } = useServerProperties()
  return usePropertyMeta(properties)
}

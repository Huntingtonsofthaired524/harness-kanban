import { PropertyGroupOrder, PropertyOrder } from '@/shared-constants'
import { PropertyMeta } from '../types/property-types'

export const sortPropertyMetas = (fields: PropertyMeta[]): PropertyMeta[] =>
  fields.slice().sort((a, b) => {
    const groupA = a.group?.id || ''
    const groupB = b.group?.id || ''
    const groupOrderA = PropertyGroupOrder[groupA] ?? 100
    const groupOrderB = PropertyGroupOrder[groupB] ?? 100

    if (groupOrderA !== groupOrderB) return groupOrderA - groupOrderB

    const orderA = PropertyOrder[a.core.propertyId] ?? a.display?.order ?? 0
    const orderB = PropertyOrder[b.core.propertyId] ?? b.display?.order ?? 0
    return orderA - orderB
  })

import { PropertyMeta, PropertyTableColumnLayout } from '@/property/types/property-types'

export const getTableLayoutGroups = (fields: PropertyMeta[]) => {
  type Layout = Exclude<PropertyTableColumnLayout, PropertyTableColumnLayout.HIDDEN>

  const layoutGroup: Record<Layout, PropertyMeta[]> = {
    [PropertyTableColumnLayout.LEFT]: [],
    [PropertyTableColumnLayout.FILL]: [],
    [PropertyTableColumnLayout.RIGHT]: [],
  }

  for (const field of fields) {
    const layout = field.table?.layout ?? PropertyTableColumnLayout.RIGHT

    if (layout !== PropertyTableColumnLayout.HIDDEN) {
      layoutGroup[layout as Layout].push(field)
    }
  }

  ;(Object.keys(layoutGroup) as Layout[]).forEach(layout => {
    layoutGroup[layout].sort((a, b) => (a.table?.order ?? 0) - (b.table?.order ?? 0))
  })

  return layoutGroup
}

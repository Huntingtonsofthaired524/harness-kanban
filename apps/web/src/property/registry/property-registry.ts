import {
  GetPropertyValueFunction,
  PropertyMeta,
  PropertyOptionsLoader,
  PropertyRendererEntry,
  PropertyShouldRenderCondition,
  RendererComponent,
  TableCellRendererComponent,
} from '@/property/types/property-types'

const registry = new Map<string, PropertyRendererEntry>()

export const registerPropertyRenderer = (propertyId: string, entry: PropertyRendererEntry) => {
  registry.set(propertyId, entry)
}

export const getEditableRenderer = (propertyId: string): RendererComponent | undefined => {
  return registry.get(propertyId)?.editable
}

export const getReadonlyRenderer = (propertyId: string): RendererComponent | undefined => {
  return registry.get(propertyId)?.readonly
}

export const getRenderer = (propertyId: string): RendererComponent | undefined => {
  const entry = registry.get(propertyId)
  return entry?.editable ?? entry?.readonly
}

export const getPropertyMeta = (propertyId: string): PropertyMeta | undefined => {
  return registry.get(propertyId)?.meta
}

export const getPropertyRendererEntry = (propertyId: string): PropertyRendererEntry | undefined => {
  return registry.get(propertyId)
}

export const getOptionsLoader = (propertyId: string): PropertyOptionsLoader | undefined => {
  return registry.get(propertyId)?.optionsLoader
}

export const getTableCellRenderer = (propertyId: string): TableCellRendererComponent | undefined => {
  return registry.get(propertyId)?.tableCell
}

export const getAllRegisteredProperties = (): string[] => Array.from(registry.keys())

export const getShouldRenderCondition = (propertyId: string): PropertyShouldRenderCondition | undefined => {
  return registry.get(propertyId)?.shouldRender
}

export const shouldRenderProperty = (propertyId: string, getValue: GetPropertyValueFunction): boolean => {
  const shouldRenderCondition = getShouldRenderCondition(propertyId)
  return shouldRenderCondition ? shouldRenderCondition(getValue) : true
}

export const REGISTRY_NAMES = {
  PROPERTY_UPDATE_PROCESSOR: 'propertyUpdateProcessor',
  CREATION_PROPERTY_PROCESSOR: 'creationPropertyProcessor',
  PROPERTY_VALUE_RESOLVER: 'propertyValueResolver',
} as const

export type RegistryName = (typeof REGISTRY_NAMES)[keyof typeof REGISTRY_NAMES]

import { SystemPropertyId } from '@repo/shared'

/**
 * Property Group Constants
 * */
export const PropertyGroupOrder: Record<string, number> = {
  '': -100,
  project: -10,
  user: 0,
  time: 10,
  other: 100,
}

export const PropertyOrder: Record<string, number> = {
  [SystemPropertyId.PROJECT]: 5,
  // time
  [SystemPropertyId.CREATED_AT]: 10,
  [SystemPropertyId.UPDATED_AT]: 20,
  [SystemPropertyId.RESOLVED_AT]: 30,
}

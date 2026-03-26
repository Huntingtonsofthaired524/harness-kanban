import { z } from 'zod'

import { getZodSchemaFromMeta } from './schema-factory'
import type { PropertyMeta } from '@/property/types/property-types'

export const getZodSchemaFromPropertyMetas = (metas: PropertyMeta[]) => {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const meta of metas) {
    shape[meta.core.propertyId] = getZodSchemaFromMeta(meta)
  }

  return z.object(shape)
}

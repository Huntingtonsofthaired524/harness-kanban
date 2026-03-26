import { z, ZodNumber, ZodString } from 'zod'

import { PropertyMeta, PropertyValidationMeta } from '@/property/types/property-types'
import type { ZodTypeAny } from 'zod'

const applyValidation = (schema: ZodTypeAny, rules: PropertyValidationMeta | undefined, type: string): ZodTypeAny => {
  if (!rules) return schema

  if (type === 'string' || type === 'rich_text' || type === 'select' || type === 'status' || type === 'project') {
    let stringSchema = schema as ZodString
    if (rules.minLength !== undefined) stringSchema = stringSchema.min(rules.minLength)
    if (rules.maxLength !== undefined) stringSchema = stringSchema.max(rules.maxLength)
    if (rules.pattern !== undefined) stringSchema = stringSchema.regex(new RegExp(rules.pattern))
    return stringSchema
  }

  if (type === 'number') {
    let numberSchema = schema as ZodNumber
    if (rules.min !== undefined) numberSchema = numberSchema.min(rules.min)
    if (rules.max !== undefined) numberSchema = numberSchema.max(rules.max)
    return numberSchema
  }

  return schema
}

export const getZodSchemaFromMeta = (meta: PropertyMeta): ZodTypeAny => {
  const type = meta.core.type
  const label = meta.display?.label ?? 'Field'
  const required = meta.core.required || false

  let schema: ZodTypeAny

  switch (type) {
    case 'string':
    case 'rich_text':
    case 'select':
    case 'status':
    case 'project':
      schema = z.string()
      break
    case 'number':
      schema = z.number()
      break
    case 'boolean':
      schema = z.boolean()
      break
    default:
      schema = z.any()
  }

  schema = applyValidation(schema, meta.validation, type)

  if (required) {
    schema = schema.refine(val => val !== null && val !== undefined && val !== '', {
      message: `${label} is required`,
    })
  } else {
    schema = schema.optional().nullable()
  }

  return schema
}

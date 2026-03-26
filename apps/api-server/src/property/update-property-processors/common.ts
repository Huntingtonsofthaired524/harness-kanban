import { z } from 'zod'

import { CommonPropertyOperationType } from '@repo/shared/property/constants'

export function createSetOperationPayloadSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
  })
}

export function isCommonSetValueOpration<T extends z.ZodTypeAny>(
  operationType: string,
  payload: Record<string, unknown>,
  valueSchema: T = z.string() as unknown as T,
): boolean {
  if (operationType !== CommonPropertyOperationType.SET.toString()) {
    return false
  }
  const schema = createSetOperationPayloadSchema(valueSchema)
  const result = schema.safeParse(payload)
  return result.success
}

export function isRemoveOperation(operationType: string): boolean {
  return operationType === CommonPropertyOperationType.CLEAR.toString()
}

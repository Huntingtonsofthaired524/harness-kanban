import { z, ZodType } from 'zod'

import { BadRequestException } from '@nestjs/common'

export const zodParse = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new BadRequestException({
      success: false,
      error: {
        code: 'INVALID_PARAMETERS',
        message: 'Invalid request parameters',
        details: z.formatError(result.error),
      },
      data: null,
    })
  }

  return result.data
}

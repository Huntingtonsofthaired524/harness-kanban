import type { ApiError } from './api-error'

export type ApiResponse<T> =
  | {
      success: true
      data: T
      error: null
    }
  | {
      success: false
      data: null
      error: ApiError
    }

export const makeSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  error: null,
})

export const makeErrorResponse = (error: ApiError): ApiResponse<never> => ({
  success: false,
  data: null,
  error,
})

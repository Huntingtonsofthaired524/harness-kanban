/**
 * API Server Type Definitions
 * Keep in sync with apps/api-server/src/common/
 */

// Error code enumeration
export const ErrorCode = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// API error interface
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

// API response type
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

// Common type definitions
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

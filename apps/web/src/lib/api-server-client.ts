/**
 * NestJS API Server Client
 * Dedicated for communication with standalone NestJS API Server
 */

import type { ApiError, ApiResponse } from '@/types/api-server'

// Configuration interface
interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

// Request configuration interface
interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

// HTTP method type
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API client exception class
export class ApiClientError extends Error {
  constructor(
    public error: ApiError,
    public status: number,
    public response?: Response,
  ) {
    super(error.message)
    this.name = 'ApiClientError'
  }

  static isApiClientError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError
  }
}

/**
 * NestJS API Server Client Class
 */
export class ApiServerClient {
  private config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig) {
    this.config = {
      baseURL: config.baseURL.replace(/\/$/, ''), // Remove trailing slash
      timeout: config.timeout ?? 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

    // Create AbortController for timeout control
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout ?? this.config.timeout)

    // Merge signals
    const signal = config.signal || controller.signal

    // Prepare headers
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...config.headers,
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal,
        credentials: 'include',
      })

      clearTimeout(timeoutId)

      // Parse response
      let responseData: ApiResponse<T>

      try {
        responseData = await response.json()
      } catch {
        // If JSON parsing fails, create an error response
        throw new ApiClientError(
          {
            code: 'PARSE_ERROR',
            message: 'Failed to parse server response',
          },
          response.status,
          response,
        )
      }

      // Check response status
      if (!response.ok) {
        if (responseData && !responseData.success && responseData.error) {
          throw new ApiClientError(responseData.error, response.status, response)
        } else {
          throw new ApiClientError(
            {
              code: 'HTTP_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            },
            response.status,
            response,
          )
        }
      }

      return responseData
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ApiClientError) {
        throw error
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError(
          {
            code: 'TIMEOUT',
            message: 'Request timeout',
          },
          0,
        )
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiClientError(
          {
            code: 'NETWORK_ERROR',
            message: 'Network error or server unavailable',
          },
          0,
        )
      }

      throw new ApiClientError(
        {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        0,
      )
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config)
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config)
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config)
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config)
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config)
  }
}

/**
 * Create API Server client without authentication (using cookie session)
 */
export const createApiServerClient = (config?: Partial<ApiClientConfig>): ApiServerClient => {
  const baseURL = config?.baseURL ?? 'http://localhost:3001'

  return new ApiServerClient({
    baseURL,
    ...config,
  })
}

import { useMemo } from 'react'

import { useApiServerClient } from '@/hooks/use-api-server'
import { IssueRowType } from '@/issue/types/issue-types'
import { convertIssueToRow } from '@/issue/utils/transform'
import { PropertyValueType } from '@/property/types/property-types'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { Issue } from '@repo/shared/property/types'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { ReadonlyURLSearchParams } from 'next/navigation'

const ISSUE_LIST_QUERY_PARAM_KEYS = ['page', 'perPage', 'sort', 'filters'] as const

export const sanitizeIssueListSearchParams = (searchParams: URLSearchParams | ReadonlyURLSearchParams) => {
  const sanitized = new URLSearchParams()

  for (const key of ISSUE_LIST_QUERY_PARAM_KEYS) {
    const value = searchParams.get(key)
    if (value !== null) {
      sanitized.set(key, value)
    }
  }

  return sanitized
}

interface GetIssuesResponseDto {
  issues: Issue[]
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export const useIssueList = (searchParams: URLSearchParams) => {
  const apiClient = useApiServerClient()
  const orgId = DEFAULT_WORKSPACE_ID
  const searchParamsString = sanitizeIssueListSearchParams(searchParams).toString()

  const { data, error, isLoading } = useQuery({
    queryKey: ['api-server', 'issues', orgId, searchParamsString],
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetIssuesResponseDto>(`/api/v1/issues?${searchParamsString}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    enabled: !!apiClient,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const issues: IssueRowType[] = (data?.issues ?? []).map(issue => {
    const row: IssueRowType = {
      id: issue.issueId,
    }

    for (const pv of issue.propertyValues) {
      row[pv.propertyId] = pv.value as PropertyValueType
    }

    return row
  })

  return {
    issues,
    totalPages: data?.pagination.totalPages,
    total: data?.pagination.total,
    page: data?.pagination.page,
    perPage: data?.pagination.perPage,
    error,
    isLoading,
  }
}

export const useInfiniteIssueList = (searchParams: URLSearchParams) => {
  const apiClient = useApiServerClient()
  const orgId = DEFAULT_WORKSPACE_ID

  const stableSearchParamsString = useMemo(() => sanitizeIssueListSearchParams(searchParams).toString(), [searchParams])

  return useInfiniteQuery({
    queryKey: ['api-server', 'issues-infinite', orgId, stableSearchParamsString],
    enabled: !!apiClient,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const params = new URLSearchParams(stableSearchParamsString)
      params.set('page', String(pageParam))

      const response = await apiClient.get<GetIssuesResponseDto>(`/api/v1/issues?${params.toString()}`)

      if (!response.success) {
        throw new Error(response.error.message)
      }

      const rows: IssueRowType[] = response.data.issues.map(convertIssueToRow)

      return {
        rows,
        pagination: response.data.pagination,
      }
    },
    getNextPageParam: lastPage => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

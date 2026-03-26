import { ApiResponse } from '@/types/api-server'
import { GetProjectsResponseDto, ProjectSummary } from '@repo/shared/project/types'

export const fetchProjects = async (
  fetcher: (url: string, options?: RequestInit) => Promise<Response>,
): Promise<ProjectSummary[]> => {
  const response = await fetcher('/api/v1/projects')
  const payload = (await response.json()) as ApiResponse<GetProjectsResponseDto>

  return payload.data?.projects ?? []
}

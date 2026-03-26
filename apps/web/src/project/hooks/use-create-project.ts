import { useApiServerClient } from '@/hooks/use-api-server'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { CreateProjectInput, CreateProjectResponseDto } from '@repo/shared/project/types'
import { SystemPropertyId } from '@repo/shared/property/constants'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreateProject = () => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()
  const orgId = DEFAULT_WORKSPACE_ID

  const mutation = useMutation({
    mutationFn: async ({ project }: { project: CreateProjectInput }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.post<CreateProjectResponseDto>('/api/v1/projects', { project })
      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.project
    },
    onSuccess: async project => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['api-server', 'projects', orgId] }),
        queryClient.invalidateQueries({ queryKey: ['property-options', SystemPropertyId.PROJECT] }),
      ])
      queryClient.setQueryData(['api-server', 'project', project.id], project)
    },
  })

  return {
    createProject: mutation.mutateAsync,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}

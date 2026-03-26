import { useApiServerClient } from '@/hooks/use-api-server'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { UpdateProjectInput, UpdateProjectResponseDto } from '@repo/shared/project/types'
import { SystemPropertyId } from '@repo/shared/property/constants'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdateProject = (projectId: string) => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()
  const orgId = DEFAULT_WORKSPACE_ID

  const mutation = useMutation({
    mutationFn: async ({ project }: { project: UpdateProjectInput }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.put<UpdateProjectResponseDto>(`/api/v1/projects/${projectId}`, { project })
      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data.project
    },
    onSuccess: async project => {
      queryClient.setQueryData(['api-server', 'project', project.id], project)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['api-server', 'projects', orgId] }),
        queryClient.invalidateQueries({ queryKey: ['property-options', SystemPropertyId.PROJECT] }),
      ])
    },
  })

  return {
    updateProject: mutation.mutateAsync,
    error: mutation.error,
    isMutating: mutation.isPending,
  }
}

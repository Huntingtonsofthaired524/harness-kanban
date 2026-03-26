'use client'

import { toast } from 'sonner'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { AnimatedTabs } from '@/components/common/animated-tabs'
import { GlobalLoading } from '@/components/common/global-loading'
import { LayoutSlot } from '@/components/layout/layout-slot'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildIssueCreateHref, IssueNavigationContext } from '@/issue/utils/navigation-context'
import { ProjectForm } from '@/project/components/project-form'
import { ProjectKanban } from '@/project/components/project-kanban'
import { useProject } from '@/project/hooks/use-project'
import { useUpdateProject } from '@/project/hooks/use-update-project'
import type { ProjectDetail, UpdateProjectInput } from '@repo/shared/project/types'

const PROJECT_TABS: Array<{ label: string; value: string }> = [
  { label: 'Kanban', value: 'kanban' },
  { label: 'Configuration', value: 'configuration' },
]

interface ProjectDetailPageViewProps {
  activeTab: string
  project: ProjectDetail
  isUpdating: boolean
  onTabChange: (tab: string) => void
  onUpdateProject: (payload: UpdateProjectInput) => Promise<void>
}

export const ProjectDetailPageView: React.FC<ProjectDetailPageViewProps> = ({
  activeTab,
  project,
  isUpdating,
  onTabChange,
  onUpdateProject,
}) => {
  const navigationContext = useMemo<IssueNavigationContext | null>(() => {
    return {
      source: 'project',
      projectId: project.id,
      projectName: project.name,
    }
  }, [project])

  return (
    <>
      <div className="bg-background sticky top-0 z-30 w-full">
        <LayoutSlot
          data-testid="project-detail-header"
          className="flex min-h-[var(--navbar-height)] w-full flex-col gap-4 px-2 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-sm font-light">
                Projects
              </Button>
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-muted-foreground px-2 text-sm font-light">{project.name}</span>
          </div>

          <AnimatedTabs tabs={PROJECT_TABS} value={activeTab} onTabChange={onTabChange} />
        </LayoutSlot>
      </div>

      {activeTab === 'kanban' ? (
        <ProjectKanban
          projectId={project.id}
          createHref={buildIssueCreateHref(navigationContext)}
          issueNavigationContext={navigationContext}
        />
      ) : (
        <LayoutSlot data-testid="project-detail-configuration" className="w-full flex-1 px-2 py-6 md:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                mode="update"
                initialProject={project}
                submitLabel="Save changes"
                isSubmitting={isUpdating}
                onSubmit={onUpdateProject}
              />
            </CardContent>
          </Card>
        </LayoutSlot>
      )}
    </>
  )
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const projectId = String(id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'configuration' ? 'configuration' : 'kanban'
  const { data: project, isLoading } = useProject(projectId)
  const { updateProject, isMutating: isUpdating } = useUpdateProject(projectId)

  const replaceSearchParams = (nextSearchParams: URLSearchParams) => {
    const query = nextSearchParams.toString()
    router.replace(query ? `?${query}` : '?')
  }

  const handleTabChange = (tab: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.set('tab', tab)
    replaceSearchParams(nextSearchParams)
  }

  const handleUpdateProject = async (payload: UpdateProjectInput) => {
    try {
      const updatedProject = await updateProject({ project: payload })
      toast.success(`Project "${updatedProject.name}" updated.`)
    } catch (error) {
      toast.error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading || !project) {
    return <GlobalLoading />
  }

  return (
    <ProjectDetailPageView
      activeTab={activeTab}
      project={project}
      isUpdating={isUpdating}
      onTabChange={handleTabChange}
      onUpdateProject={handleUpdateProject}
    />
  )
}

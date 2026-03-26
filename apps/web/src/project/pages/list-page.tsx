'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { LayoutSlot } from '@/components/layout/layout-slot'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectCard, ProjectCreateCard } from '@/project/components/project-card'
import { ProjectForm } from '@/project/components/project-form'
import { useCreateProject } from '@/project/hooks/use-create-project'
import { useProjectList } from '@/project/hooks/use-project-list'

export const ProjectListPage: React.FC = () => {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data: projects = [], isLoading } = useProjectList()
  const { createProject, isMutating: isCreating } = useCreateProject()

  const handleCreateProject = async (project: Parameters<typeof createProject>[0]['project']) => {
    try {
      const createdProject = await createProject({ project })
      setIsCreateOpen(false)
      toast.success(`Project "${createdProject.name}" created.`)
      router.push(`/projects/${createdProject.id}`)
    } catch (error) {
      toast.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      <LayoutSlot className="container mx-auto max-w-6xl flex-1 px-2 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-base font-semibold">Projects</h1>
        </div>

        {isLoading ? (
          <GlobalLoading />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} href={`/projects/${project.id}`} />
            ))}
            <ProjectCreateCard onClick={() => setIsCreateOpen(true)} />
          </div>
        )}
      </LayoutSlot>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>Add a repository-backed project and make it available to issues.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto pr-1">
            <ProjectForm
              mode="create"
              submitLabel="Create project"
              isSubmitting={isCreating}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={handleCreateProject}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

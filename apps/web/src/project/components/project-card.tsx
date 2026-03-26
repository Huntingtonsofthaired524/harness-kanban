'use client'

import { GitBranch } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/shadcn/utils'
import { ProjectSummary } from '@repo/shared/project/types'

interface ProjectCardProps {
  project: ProjectSummary
  href: string
}

const formatProjectRepositoryLabel = (githubRepoUrl: string) => {
  const fallbackLabel = githubRepoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')

  try {
    const url = new URL(githubRepoUrl)
    return url.pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '') || fallbackLabel
  } catch {
    return fallbackLabel || githubRepoUrl
  }
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, href }) => {
  return (
    <Link href={href} className="group block h-full">
      <Card className="hover:border-foreground/30 hover:bg-accent/30 h-full justify-between transition-colors">
        <CardHeader className="gap-2">
          <CardTitle className="line-clamp-2 text-lg">{project.name}</CardTitle>
          <CardDescription className="line-clamp-1 text-sm">
            {formatProjectRepositoryLabel(project.githubRepoUrl)}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="text-muted-foreground size-4" />
            <span className="truncate">{project.repoBaseBranch}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface ProjectCreateCardProps {
  onClick: () => void
}

export const ProjectCreateCard: React.FC<ProjectCreateCardProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:border-foreground/30 hover:bg-accent/30 flex h-full min-h-[244px] w-full flex-col items-center justify-center rounded-xl border border-dashed transition-colors',
      )}>
      <span className="mb-3 text-4xl leading-none">+</span>
      <span className="text-sm font-medium">Create project</span>
    </button>
  )
}

import type { ReadonlyURLSearchParams } from 'next/navigation'

export type IssueNavigationContext =
  | {
      source: 'issues'
    }
  | {
      source: 'project'
      projectId: string
      projectName?: string
    }

const ISSUE_SOURCE_PARAM = 'issueSource'
const ISSUE_PROJECT_ID_PARAM = 'issueProjectId'
const ISSUE_PROJECT_NAME_PARAM = 'issueProjectName'

export const parseIssueNavigationContext = (
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): IssueNavigationContext | null => {
  const source = searchParams.get(ISSUE_SOURCE_PARAM)

  if (source === 'issues') {
    return { source: 'issues' }
  }

  if (source === 'project') {
    const projectId = searchParams.get(ISSUE_PROJECT_ID_PARAM)
    if (!projectId) {
      return null
    }

    const projectName = searchParams.get(ISSUE_PROJECT_NAME_PARAM) ?? undefined
    return {
      source: 'project',
      projectId,
      projectName,
    }
  }

  return null
}

export const applyIssueNavigationContext = (
  searchParams: URLSearchParams,
  context: IssueNavigationContext | null | undefined,
) => {
  searchParams.delete(ISSUE_SOURCE_PARAM)
  searchParams.delete(ISSUE_PROJECT_ID_PARAM)
  searchParams.delete(ISSUE_PROJECT_NAME_PARAM)

  if (!context) {
    return searchParams
  }

  if (context.source === 'project') {
    searchParams.set(ISSUE_SOURCE_PARAM, context.source)
    searchParams.set(ISSUE_PROJECT_ID_PARAM, context.projectId)
    if (context.projectName) {
      searchParams.set(ISSUE_PROJECT_NAME_PARAM, context.projectName)
    }
  }

  return searchParams
}

export const buildIssueCreateHref = (context: IssueNavigationContext | null | undefined) => {
  const searchParams = applyIssueNavigationContext(new URLSearchParams(), context)
  const query = searchParams.toString()

  return query ? `/issues/new?${query}` : '/issues/new'
}

export const buildIssueDetailHref = (issueId: number, context: IssueNavigationContext | null | undefined) => {
  const searchParams = applyIssueNavigationContext(new URLSearchParams(), context)
  const query = searchParams.toString()

  return query ? `/issues/${issueId}?${query}` : `/issues/${issueId}`
}

export const resolveIssueBackTarget = (context: IssueNavigationContext | null | undefined) => {
  if (!context || context.source === 'issues') {
    return {
      href: '/projects',
      label: 'Projects',
    }
  }

  return {
    href: `/projects/${context.projectId}?tab=kanban`,
    label: context.projectName ?? 'Project',
  }
}

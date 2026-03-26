import { describe, expect, it } from 'vitest'

import {
  buildIssueCreateHref,
  buildIssueDetailHref,
  parseIssueNavigationContext,
  resolveIssueBackTarget,
} from '../navigation-context'

describe('issue navigation context', () => {
  it('does not append issueSource for issue-list-style fallbacks', () => {
    expect(buildIssueCreateHref(null)).toBe('/issues/new')
    expect(buildIssueCreateHref({ source: 'issues' })).toBe('/issues/new')
    expect(buildIssueDetailHref(42, null)).toBe('/issues/42')
    expect(buildIssueDetailHref(42, { source: 'issues' })).toBe('/issues/42')
  })

  it('preserves project context in generated issue links', () => {
    const context = {
      source: 'project' as const,
      projectId: 'project-1',
      projectName: 'Infra',
    }

    expect(buildIssueCreateHref(context)).toBe(
      '/issues/new?issueSource=project&issueProjectId=project-1&issueProjectName=Infra',
    )
    expect(buildIssueDetailHref(7, context)).toBe(
      '/issues/7?issueSource=project&issueProjectId=project-1&issueProjectName=Infra',
    )
  })

  it('uses projects as the fallback back target when issue list context is absent or legacy', () => {
    expect(resolveIssueBackTarget(null)).toEqual({
      href: '/projects',
      label: 'Projects',
    })

    expect(resolveIssueBackTarget({ source: 'issues' })).toEqual({
      href: '/projects',
      label: 'Projects',
    })
  })

  it('parses legacy issues context and project context from search params', () => {
    expect(parseIssueNavigationContext(new URLSearchParams('issueSource=issues'))).toEqual({
      source: 'issues',
    })

    expect(
      parseIssueNavigationContext(
        new URLSearchParams('issueSource=project&issueProjectId=project-1&issueProjectName=Infra'),
      ),
    ).toEqual({
      source: 'project',
      projectId: 'project-1',
      projectName: 'Infra',
    })
  })
})

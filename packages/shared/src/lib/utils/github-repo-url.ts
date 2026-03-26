export type GithubRepoReference = {
  owner: string
  repo: string
}

const GITHUB_SCP_LIKE_REPOSITORY_PATTERN = /^git@github\.com:(?<owner>[^/\s:]+)\/(?<repo>[^/\s]+?)(?:\.git)?$/i

export const parseGithubRepoReference = (raw: string): GithubRepoReference | null => {
  const value = raw.trim()
  if (!value) {
    return null
  }

  const scpLikeMatch = GITHUB_SCP_LIKE_REPOSITORY_PATTERN.exec(value)
  if (scpLikeMatch?.groups?.owner && scpLikeMatch.groups.repo) {
    return {
      owner: scpLikeMatch.groups.owner,
      repo: scpLikeMatch.groups.repo,
    }
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  const hostname = parsed.hostname.toLowerCase()
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return null
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'https:' && protocol !== 'http:' && protocol !== 'ssh:') {
    return null
  }

  const segments = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (segments.length < 2) {
    return null
  }

  const owner = segments[0]
  const repo = segments[1]?.replace(/\.git$/i, '')
  if (!owner || !repo) {
    return null
  }

  return { owner, repo }
}

export const normalizeGithubRepoUrl = (raw: string): string | null => {
  const reference = parseGithubRepoReference(raw)
  if (!reference) {
    return null
  }

  return `https://github.com/${reference.owner}/${reference.repo}`
}

export const isSupportedGithubRepoReference = (raw: string): boolean => {
  return normalizeGithubRepoUrl(raw) !== null
}

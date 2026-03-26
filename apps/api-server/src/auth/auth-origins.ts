function parseOriginList(value: null | string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

export function getTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return Array.from(new Set(parseOriginList(env.APP_BASE_URL)))
}

export function getCorsAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  return Array.from(
    new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...parseOriginList(env.BETTER_AUTH_URL),
      ...getTrustedOrigins(env),
    ]),
  )
}

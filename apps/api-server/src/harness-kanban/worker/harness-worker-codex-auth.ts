import { ConfigService } from '@nestjs/config'

// review: gratuitous encapsulation
export async function resolveCodexAuthJson(configService: ConfigService): Promise<string | null> {
  const inlineAuthJson = configService.get<string>('CODEX_AUTH_JSON')?.trim()
  return inlineAuthJson || null
}

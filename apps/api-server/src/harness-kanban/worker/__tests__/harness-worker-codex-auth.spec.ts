import { ConfigService } from '@nestjs/config'
import { resolveCodexAuthJson } from '../harness-worker-codex-auth'

describe('resolveCodexAuthJson', () => {
  it('returns inline CODEX_AUTH_JSON when configured', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'CODEX_AUTH_JSON') {
          return '{"provider":"openai","accessToken":"inline-token"}'
        }

        return undefined
      }),
    } as unknown as ConfigService

    await expect(resolveCodexAuthJson(configService)).resolves.toBe(
      '{"provider":"openai","accessToken":"inline-token"}',
    )
  })

  it('returns null when CODEX_AUTH_JSON is missing', async () => {
    const configService = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService

    await expect(resolveCodexAuthJson(configService)).resolves.toBeNull()
  })
})

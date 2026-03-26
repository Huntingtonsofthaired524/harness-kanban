import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface AnthropicModule {
  createAnthropic: (options: { apiKey?: string; baseURL?: string }) => (modelId: string) => LanguageModel
}

export class AnthropicProvider extends BaseAIProvider {
  readonly id = 'anthropic' as const
  readonly name = 'Anthropic'
  readonly packageName = '@ai-sdk/anthropic'
  readonly defaultModel = 'claude-3-5-sonnet-20241022'

  validateConfig(config: ProviderConfig): void {
    if (config.apiKey && !config.apiKey.startsWith('sk-ant')) {
      // Anthropic keys typically start with sk-ant
      console.warn('Warning: Anthropic API key should typically start with "sk-ant"')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<AnthropicModule>()
    const createAnthropic = module.createAnthropic

    const provider = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface OpenAIModule {
  createOpenAI: (options: { apiKey?: string; baseURL?: string }) => (modelId: string) => LanguageModel
}

export class OpenAIProvider extends BaseAIProvider {
  readonly id = 'openai' as const
  readonly name = 'OpenAI'
  readonly packageName = '@ai-sdk/openai'
  readonly defaultModel = 'gpt-4o-mini'

  validateConfig(config: ProviderConfig): void {
    if (config.apiKey && config.apiKey.length < 20) {
      throw new Error('Invalid OpenAI API key format')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<OpenAIModule>()
    const createOpenAI = module.createOpenAI

    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface CohereModule {
  createCohere: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class CohereProvider extends BaseAIProvider {
  readonly id = 'cohere' as const
  readonly name = 'Cohere'
  readonly packageName = '@ai-sdk/cohere'
  readonly defaultModel = 'command-r-plus'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Cohere API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<CohereModule>()
    const createCohere = module.createCohere

    const provider = createCohere({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

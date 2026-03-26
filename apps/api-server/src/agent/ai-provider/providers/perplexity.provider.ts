import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface PerplexityModule {
  createPerplexity: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class PerplexityProvider extends BaseAIProvider {
  readonly id = 'perplexity' as const
  readonly name = 'Perplexity'
  readonly packageName = '@ai-sdk/perplexity'
  readonly defaultModel = 'sonar-pro'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Perplexity API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<PerplexityModule>()
    const createPerplexity = module.createPerplexity

    const provider = createPerplexity({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface MistralModule {
  createMistral: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class MistralProvider extends BaseAIProvider {
  readonly id = 'mistral' as const
  readonly name = 'Mistral AI'
  readonly packageName = '@ai-sdk/mistral'
  readonly defaultModel = 'mistral-large-latest'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Mistral API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<MistralModule>()
    const createMistral = module.createMistral

    const provider = createMistral({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

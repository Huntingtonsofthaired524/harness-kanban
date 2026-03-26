import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface BasetenModule {
  createBaseten: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class BasetenProvider extends BaseAIProvider {
  readonly id = 'baseten' as const
  readonly name = 'Baseten'
  readonly packageName = '@ai-sdk/baseten'
  readonly defaultModel = 'llama-3.1-70b'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Baseten API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<BasetenModule>()
    const createBaseten = module.createBaseten

    const provider = createBaseten({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

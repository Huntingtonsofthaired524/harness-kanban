import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface FireworksModule {
  createFireworks: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class FireworksProvider extends BaseAIProvider {
  readonly id = 'fireworks' as const
  readonly name = 'Fireworks'
  readonly packageName = '@ai-sdk/fireworks'
  readonly defaultModel = 'accounts/fireworks/models/llama-v3p3-70b-instruct'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Fireworks API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<FireworksModule>()
    const createFireworks = module.createFireworks

    const provider = createFireworks({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

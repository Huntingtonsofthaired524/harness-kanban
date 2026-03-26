import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface FalModule {
  createFal: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class FalProvider extends BaseAIProvider {
  readonly id = 'fal' as const
  readonly name = 'Fal'
  readonly packageName = '@ai-sdk/fal'
  readonly defaultModel = 'fal-ai/llama-3.1-70b'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Fal API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<FalModule>()
    const createFal = module.createFal

    const provider = createFal({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface ProdiaModule {
  createProdia: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class ProdiaProvider extends BaseAIProvider {
  readonly id = 'prodia' as const
  readonly name = 'Prodia'
  readonly packageName = '@ai-sdk/prodia'
  readonly defaultModel = 'sd-xl'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Prodia API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<ProdiaModule>()
    const createProdia = module.createProdia

    const provider = createProdia({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

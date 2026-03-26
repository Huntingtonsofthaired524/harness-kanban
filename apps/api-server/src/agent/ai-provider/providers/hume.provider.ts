import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface HumeModule {
  createHume: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class HumeProvider extends BaseAIProvider {
  readonly id = 'hume' as const
  readonly name = 'Hume'
  readonly packageName = '@ai-sdk/hume'
  readonly defaultModel = 'hume-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Hume API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<HumeModule>()
    const createHume = module.createHume

    const provider = createHume({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

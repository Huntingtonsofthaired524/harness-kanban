import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface LumaModule {
  createLuma: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class LumaProvider extends BaseAIProvider {
  readonly id = 'luma' as const
  readonly name = 'Luma'
  readonly packageName = '@ai-sdk/luma'
  readonly defaultModel = 'luma-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Luma API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<LumaModule>()
    const createLuma = module.createLuma

    const provider = createLuma({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

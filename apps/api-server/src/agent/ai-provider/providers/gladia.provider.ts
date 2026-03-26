import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface GladiaModule {
  createGladia: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class GladiaProvider extends BaseAIProvider {
  readonly id = 'gladia' as const
  readonly name = 'Gladia'
  readonly packageName = '@ai-sdk/gladia'
  readonly defaultModel = 'gladia-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Gladia API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<GladiaModule>()
    const createGladia = module.createGladia

    const provider = createGladia({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

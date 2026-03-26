import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface BlackForestLabsModule {
  createBlackForestLabs: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class BlackForestLabsProvider extends BaseAIProvider {
  readonly id = 'black-forest-labs' as const
  readonly name = 'Black Forest Labs'
  readonly packageName = '@ai-sdk/black-forest-labs'
  readonly defaultModel = 'flux-pro'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Black Forest Labs API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<BlackForestLabsModule>()
    const createBlackForestLabs = module.createBlackForestLabs

    const provider = createBlackForestLabs({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

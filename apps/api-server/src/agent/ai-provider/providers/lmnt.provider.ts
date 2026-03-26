import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface LMNTModule {
  createLMNT: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class LMNTProvider extends BaseAIProvider {
  readonly id = 'lmnt' as const
  readonly name = 'LMNT'
  readonly packageName = '@ai-sdk/lmnt'
  readonly defaultModel = 'lmnt-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('LMNT API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<LMNTModule>()
    const createLMNT = module.createLMNT

    const provider = createLMNT({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

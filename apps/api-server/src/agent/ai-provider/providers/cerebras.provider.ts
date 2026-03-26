import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface CerebrasModule {
  createCerebras: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class CerebrasProvider extends BaseAIProvider {
  readonly id = 'cerebras' as const
  readonly name = 'Cerebras'
  readonly packageName = '@ai-sdk/cerebras'
  readonly defaultModel = 'llama3.1-70b'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Cerebras API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<CerebrasModule>()
    const createCerebras = module.createCerebras

    const provider = createCerebras({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

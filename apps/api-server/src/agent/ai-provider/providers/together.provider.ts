import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface TogetherModule {
  createTogetherAI: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class TogetherProvider extends BaseAIProvider {
  readonly id = 'together' as const
  readonly name = 'Together.ai'
  readonly packageName = '@ai-sdk/togetherai'
  readonly defaultModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Together.ai API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<TogetherModule>()
    const createTogetherAI = module.createTogetherAI

    const provider = createTogetherAI({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

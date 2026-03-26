import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface MoonshotModule {
  createMoonshotAI: (options: { apiKey?: string; baseURL?: string }) => (modelId: string) => LanguageModel
}

export class MoonshotProvider extends BaseAIProvider {
  readonly id = 'moonshot' as const
  readonly name = 'Moonshot AI'
  readonly packageName = '@ai-sdk/moonshotai'
  readonly defaultModel = 'moonshot-v1-8k'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Moonshot API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<MoonshotModule>()
    const createMoonshotAI = module.createMoonshotAI

    const provider = createMoonshotAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })

    return provider(config.model)
  }
}

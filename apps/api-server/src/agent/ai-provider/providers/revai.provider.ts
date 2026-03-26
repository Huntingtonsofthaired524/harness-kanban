import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface RevAIModule {
  createRevAI: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class RevAIProvider extends BaseAIProvider {
  readonly id = 'revai' as const
  readonly name = 'Rev.ai'
  readonly packageName = '@ai-sdk/revai'
  readonly defaultModel = 'revai-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Rev.ai API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<RevAIModule>()
    const createRevAI = module.createRevAI

    const provider = createRevAI({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

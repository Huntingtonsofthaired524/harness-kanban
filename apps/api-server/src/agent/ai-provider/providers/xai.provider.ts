import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface XAIModule {
  createXai: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class XAIProvider extends BaseAIProvider {
  readonly id = 'xai' as const
  readonly name = 'xAI'
  readonly packageName = '@ai-sdk/xai'
  readonly defaultModel = 'grok-2-1212'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('xAI API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<XAIModule>()
    const createXai = module.createXai

    const provider = createXai({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

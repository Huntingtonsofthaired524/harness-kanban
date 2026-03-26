import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface DeepSeekModule {
  createDeepSeek: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class DeepSeekProvider extends BaseAIProvider {
  readonly id = 'deepseek' as const
  readonly name = 'DeepSeek'
  readonly packageName = '@ai-sdk/deepseek'
  readonly defaultModel = 'deepseek-chat'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('DeepSeek API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<DeepSeekModule>()
    const createDeepSeek = module.createDeepSeek

    const provider = createDeepSeek({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

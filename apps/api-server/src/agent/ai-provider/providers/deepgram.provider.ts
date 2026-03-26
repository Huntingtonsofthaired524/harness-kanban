import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface DeepgramModule {
  createDeepgram: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class DeepgramProvider extends BaseAIProvider {
  readonly id = 'deepgram' as const
  readonly name = 'Deepgram'
  readonly packageName = '@ai-sdk/deepgram'
  readonly defaultModel = 'nova-2'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Deepgram API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<DeepgramModule>()
    const createDeepgram = module.createDeepgram

    const provider = createDeepgram({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

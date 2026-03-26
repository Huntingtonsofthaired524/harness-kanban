import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface HuggingFaceModule {
  createHuggingFace: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class HuggingFaceProvider extends BaseAIProvider {
  readonly id = 'huggingface' as const
  readonly name = 'Hugging Face'
  readonly packageName = '@ai-sdk/huggingface'
  readonly defaultModel = 'meta-llama/Llama-3.1-70B-Instruct'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Hugging Face API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<HuggingFaceModule>()
    const createHuggingFace = module.createHuggingFace

    const provider = createHuggingFace({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface ReplicateModule {
  createReplicate: (options: { apiToken?: string }) => (modelId: string) => LanguageModel
}

export class ReplicateProvider extends BaseAIProvider {
  readonly id = 'replicate' as const
  readonly name = 'Replicate'
  readonly packageName = '@ai-sdk/replicate'
  readonly defaultModel = 'meta/llama-3.1-70b-instruct'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Replicate API token is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<ReplicateModule>()
    const createReplicate = module.createReplicate

    const provider = createReplicate({
      apiToken: config.apiKey,
    })

    return provider(config.model)
  }
}

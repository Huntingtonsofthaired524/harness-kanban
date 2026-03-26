import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface DeepInfraModule {
  createDeepInfra: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class DeepInfraProvider extends BaseAIProvider {
  readonly id = 'deepinfra' as const
  readonly name = 'DeepInfra'
  readonly packageName = '@ai-sdk/deepinfra'
  readonly defaultModel = 'meta-llama/Llama-3.3-70B-Instruct'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('DeepInfra API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<DeepInfraModule>()
    const createDeepInfra = module.createDeepInfra

    const provider = createDeepInfra({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

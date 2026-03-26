import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface OpenResponsesModule {
  createOpenResponses: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class OpenResponsesProvider extends BaseAIProvider {
  readonly id = 'open-responses' as const
  readonly name = 'Open Responses'
  readonly packageName = '@ai-sdk/open-responses'
  readonly defaultModel = 'open-responses-1'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Open Responses API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<OpenResponsesModule>()
    const createOpenResponses = module.createOpenResponses

    const provider = createOpenResponses({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

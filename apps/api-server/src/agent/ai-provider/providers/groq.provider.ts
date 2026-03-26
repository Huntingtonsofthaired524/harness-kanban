import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface GroqModule {
  createGroq: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class GroqProvider extends BaseAIProvider {
  readonly id = 'groq' as const
  readonly name = 'Groq'
  readonly packageName = '@ai-sdk/groq'
  readonly defaultModel = 'llama-3.3-70b-versatile'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Groq API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<GroqModule>()
    const createGroq = module.createGroq

    const provider = createGroq({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

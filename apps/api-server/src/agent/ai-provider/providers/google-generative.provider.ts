import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface GoogleGenerativeModule {
  createGoogleGenerativeAI: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class GoogleGenerativeProvider extends BaseAIProvider {
  readonly id = 'google-generative' as const
  readonly name = 'Google Generative AI'
  readonly packageName = '@ai-sdk/google'
  readonly defaultModel = 'gemini-1.5-pro'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Google Generative AI API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<GoogleGenerativeModule>()
    const createGoogleGenerativeAI = module.createGoogleGenerativeAI

    const provider = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface ElevenLabsModule {
  createElevenLabs: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class ElevenLabsProvider extends BaseAIProvider {
  readonly id = 'elevenlabs' as const
  readonly name = 'ElevenLabs'
  readonly packageName = '@ai-sdk/elevenlabs'
  readonly defaultModel = 'eleven-multilingual-v2'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('ElevenLabs API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<ElevenLabsModule>()
    const createElevenLabs = module.createElevenLabs

    const provider = createElevenLabs({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

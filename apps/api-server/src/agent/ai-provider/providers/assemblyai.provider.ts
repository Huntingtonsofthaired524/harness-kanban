import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface AssemblyAIModule {
  createAssemblyAI: (options: { apiKey?: string }) => (modelId: string) => LanguageModel
}

export class AssemblyAIProvider extends BaseAIProvider {
  readonly id = 'assemblyai' as const
  readonly name = 'AssemblyAI'
  readonly packageName = '@ai-sdk/assemblyai'
  readonly defaultModel = 'lemur-v3'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('AssemblyAI API key is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<AssemblyAIModule>()
    const createAssemblyAI = module.createAssemblyAI

    const provider = createAssemblyAI({
      apiKey: config.apiKey,
    })

    return provider(config.model)
  }
}

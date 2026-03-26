import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface GoogleVertexModule {
  createVertex: (options: { project?: string; location?: string }) => (modelId: string) => LanguageModel
}

export class GoogleVertexProvider extends BaseAIProvider {
  readonly id = 'google-vertex' as const
  readonly name = 'Google Vertex AI'
  readonly packageName = '@ai-sdk/google-vertex'
  readonly defaultModel = 'gemini-1.5-pro'

  validateConfig(config: ProviderConfig): void {
    if (!config.project) {
      throw new Error('Google Vertex AI project is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<GoogleVertexModule>()
    const createVertex = module.createVertex

    const provider = createVertex({
      project: config.project as string | undefined,
      location: (config.location as string) || 'us-central1',
    })

    return provider(config.model)
  }
}

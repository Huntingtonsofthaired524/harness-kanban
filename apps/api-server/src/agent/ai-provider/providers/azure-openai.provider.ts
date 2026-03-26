import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface AzureOpenAIModule {
  createAzure: (options: {
    apiKey?: string
    resourceName?: string
    deploymentName?: string
    apiVersion?: string
  }) => (modelId: string) => LanguageModel
}

export class AzureOpenAIProvider extends BaseAIProvider {
  readonly id = 'azure-openai' as const
  readonly name = 'Azure OpenAI'
  readonly packageName = '@ai-sdk/azure'
  readonly defaultModel = 'gpt-4o-mini'

  validateConfig(config: ProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Azure OpenAI API key is required')
    }
    if (!config.resourceName) {
      throw new Error('Azure OpenAI resource name is required')
    }
    if (!config.deploymentName) {
      throw new Error('Azure OpenAI deployment name is required')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<AzureOpenAIModule>()
    const createAzure = module.createAzure

    const provider = createAzure({
      apiKey: config.apiKey,
      resourceName: config.resourceName as string | undefined,
      deploymentName: config.deploymentName as string | undefined,
      apiVersion: (config.apiVersion as string) || '2024-10-21',
    })

    return provider(config.model)
  }
}

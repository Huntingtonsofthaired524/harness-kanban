import { LanguageModel } from 'ai'

import { ProviderConfig } from '../ai-provider.types'
import { BaseAIProvider } from './base.provider'

interface BedrockModule {
  createAmazonBedrock: (options: {
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
  }) => (modelId: string) => LanguageModel
}

export class BedrockProvider extends BaseAIProvider {
  readonly id = 'bedrock' as const
  readonly name = 'Amazon Bedrock'
  readonly packageName = '@ai-sdk/amazon-bedrock'
  readonly defaultModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0'

  validateConfig(config: ProviderConfig): void {
    // Bedrock can use AWS credentials from environment or IAM role
    // Only validate if explicitly provided
    const accessKeyId = config.accessKeyId as string | undefined
    if (accessKeyId && accessKeyId.length < 16) {
      throw new Error('Invalid AWS Access Key ID format')
    }
  }

  async createModel(config: ProviderConfig): Promise<LanguageModel> {
    const module = await this.importProvider<BedrockModule>()
    const createAmazonBedrock = module.createAmazonBedrock

    const provider = createAmazonBedrock({
      region: (config.region as string) || 'us-east-1',
      accessKeyId: config.accessKeyId as string | undefined,
      secretAccessKey: config.secretAccessKey as string | undefined,
    })

    return provider(config.model)
  }
}

import { LanguageModel } from 'ai'

import { ConfigService } from '@nestjs/config'
import { getProviderConfig } from './ai-provider.config'
import { AI_PROVIDER_IDS, DEFAULT_AI_PROVIDER } from './ai-provider.constants'
import { AIProvider, AIProviderId, ProviderConfig } from './ai-provider.types'
import {
  AnthropicProvider,
  AssemblyAIProvider,
  AzureOpenAIProvider,
  BasetenProvider,
  BedrockProvider,
  BlackForestLabsProvider,
  CerebrasProvider,
  CohereProvider,
  DeepgramProvider,
  DeepInfraProvider,
  DeepSeekProvider,
  ElevenLabsProvider,
  FalProvider,
  FireworksProvider,
  GladiaProvider,
  GoogleGenerativeProvider,
  GoogleVertexProvider,
  GroqProvider,
  HuggingFaceProvider,
  HumeProvider,
  LMNTProvider,
  LumaProvider,
  MistralProvider,
  MoonshotProvider,
  OpenAIProvider,
  OpenResponsesProvider,
  PerplexityProvider,
  ProdiaProvider,
  ReplicateProvider,
  RevAIProvider,
  TogetherProvider,
  VercelAIGatewayProvider,
  XAIProvider,
} from './providers'

export class AIProviderFactory {
  private readonly providers = new Map<AIProviderId, AIProvider>()

  constructor(private readonly configService: ConfigService) {
    this.registerProviders()
  }

  private registerProviders(): void {
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('anthropic', new AnthropicProvider())
    this.providers.set('google-generative', new GoogleGenerativeProvider())
    this.providers.set('google-vertex', new GoogleVertexProvider())
    this.providers.set('azure-openai', new AzureOpenAIProvider())
    this.providers.set('xai', new XAIProvider())
    this.providers.set('deepseek', new DeepSeekProvider())
    this.providers.set('mistral', new MistralProvider())
    this.providers.set('moonshot', new MoonshotProvider())
    this.providers.set('cohere', new CohereProvider())
    this.providers.set('bedrock', new BedrockProvider())
    this.providers.set('groq', new GroqProvider())
    this.providers.set('cerebras', new CerebrasProvider())
    this.providers.set('together', new TogetherProvider())
    this.providers.set('fireworks', new FireworksProvider())
    this.providers.set('deepinfra', new DeepInfraProvider())
    this.providers.set('baseten', new BasetenProvider())
    this.providers.set('fal', new FalProvider())
    this.providers.set('black-forest-labs', new BlackForestLabsProvider())
    this.providers.set('luma', new LumaProvider())
    this.providers.set('replicate', new ReplicateProvider())
    this.providers.set('prodia', new ProdiaProvider())
    this.providers.set('elevenlabs', new ElevenLabsProvider())
    this.providers.set('assemblyai', new AssemblyAIProvider())
    this.providers.set('deepgram', new DeepgramProvider())
    this.providers.set('gladia', new GladiaProvider())
    this.providers.set('lmnt', new LMNTProvider())
    this.providers.set('revai', new RevAIProvider())
    this.providers.set('hume', new HumeProvider())
    this.providers.set('vercel-ai-gateway', new VercelAIGatewayProvider())
    this.providers.set('open-responses', new OpenResponsesProvider())
    this.providers.set('huggingface', new HuggingFaceProvider())
    this.providers.set('perplexity', new PerplexityProvider())
  }

  getActiveProviderId(): AIProviderId {
    const providerId = this.configService.get<AIProviderId>('AI_PROVIDER')
    if (providerId && AI_PROVIDER_IDS.includes(providerId)) {
      return providerId
    }
    return DEFAULT_AI_PROVIDER
  }

  getProvider(providerId: AIProviderId): AIProvider {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Unknown AI provider: ${providerId}. ` + `Available providers: ${AI_PROVIDER_IDS.join(', ')}`)
    }
    return provider
  }

  getActiveProvider(): AIProvider {
    const providerId = this.getActiveProviderId()
    return this.getProvider(providerId)
  }

  getProviderConfig(providerId: AIProviderId): ProviderConfig {
    const provider = this.getProvider(providerId)
    // Build env object from configService to support both real env and mock config in tests
    const env: Record<string, string | undefined> = {
      // OpenAI
      OPENAI_API_KEY: this.configService.get('OPENAI_API_KEY'),
      OPENAI_MODEL: this.configService.get('OPENAI_MODEL'),
      OPENAI_BASE_URL: this.configService.get('OPENAI_BASE_URL'),
      // Anthropic
      ANTHROPIC_API_KEY: this.configService.get('ANTHROPIC_API_KEY'),
      ANTHROPIC_MODEL: this.configService.get('ANTHROPIC_MODEL'),
      ANTHROPIC_BASE_URL: this.configService.get('ANTHROPIC_BASE_URL'),
      // Google Generative AI
      GOOGLE_GENERATIVE_API_KEY: this.configService.get('GOOGLE_GENERATIVE_API_KEY'),
      GOOGLE_GENERATIVE_MODEL: this.configService.get('GOOGLE_GENERATIVE_MODEL'),
      // Google Vertex AI
      GOOGLE_VERTEX_PROJECT: this.configService.get('GOOGLE_VERTEX_PROJECT'),
      GOOGLE_VERTEX_LOCATION: this.configService.get('GOOGLE_VERTEX_LOCATION'),
      GOOGLE_VERTEX_MODEL: this.configService.get('GOOGLE_VERTEX_MODEL'),
      // Azure OpenAI
      AZURE_OPENAI_API_KEY: this.configService.get('AZURE_OPENAI_API_KEY'),
      AZURE_OPENAI_RESOURCE_NAME: this.configService.get('AZURE_OPENAI_RESOURCE_NAME'),
      AZURE_OPENAI_DEPLOYMENT_NAME: this.configService.get('AZURE_OPENAI_DEPLOYMENT_NAME'),
      AZURE_OPENAI_API_VERSION: this.configService.get('AZURE_OPENAI_API_VERSION'),
      // xAI
      XAI_API_KEY: this.configService.get('XAI_API_KEY'),
      XAI_MODEL: this.configService.get('XAI_MODEL'),
      // DeepSeek
      DEEPSEEK_API_KEY: this.configService.get('DEEPSEEK_API_KEY'),
      DEEPSEEK_MODEL: this.configService.get('DEEPSEEK_MODEL'),
      // Mistral
      MISTRAL_API_KEY: this.configService.get('MISTRAL_API_KEY'),
      MISTRAL_MODEL: this.configService.get('MISTRAL_MODEL'),
      // Moonshot
      MOONSHOT_API_KEY: this.configService.get('MOONSHOT_API_KEY'),
      MOONSHOT_MODEL: this.configService.get('MOONSHOT_MODEL'),
      MOONSHOT_BASE_URL: this.configService.get('MOONSHOT_BASE_URL'),
      // Cohere
      COHERE_API_KEY: this.configService.get('COHERE_API_KEY'),
      COHERE_MODEL: this.configService.get('COHERE_MODEL'),
      // Bedrock
      BEDROCK_ACCESS_KEY_ID: this.configService.get('BEDROCK_ACCESS_KEY_ID'),
      BEDROCK_SECRET_ACCESS_KEY: this.configService.get('BEDROCK_SECRET_ACCESS_KEY'),
      BEDROCK_REGION: this.configService.get('BEDROCK_REGION'),
      BEDROCK_MODEL: this.configService.get('BEDROCK_MODEL'),
      // Groq
      GROQ_API_KEY: this.configService.get('GROQ_API_KEY'),
      GROQ_MODEL: this.configService.get('GROQ_MODEL'),
      // Cerebras
      CEREBRAS_API_KEY: this.configService.get('CEREBRAS_API_KEY'),
      CEREBRAS_MODEL: this.configService.get('CEREBRAS_MODEL'),
      // Together
      TOGETHER_API_KEY: this.configService.get('TOGETHER_API_KEY'),
      TOGETHER_MODEL: this.configService.get('TOGETHER_MODEL'),
      // Fireworks
      FIREWORKS_API_KEY: this.configService.get('FIREWORKS_API_KEY'),
      FIREWORKS_MODEL: this.configService.get('FIREWORKS_MODEL'),
      // DeepInfra
      DEEPINFRA_API_KEY: this.configService.get('DEEPINFRA_API_KEY'),
      DEEPINFRA_MODEL: this.configService.get('DEEPINFRA_MODEL'),
      // Baseten
      BASETEN_API_KEY: this.configService.get('BASETEN_API_KEY'),
      // Fal
      FAL_API_KEY: this.configService.get('FAL_API_KEY'),
      // Black Forest Labs
      BLACK_FOREST_LABS_API_KEY: this.configService.get('BLACK_FOREST_LABS_API_KEY'),
      // Luma
      LUMA_API_KEY: this.configService.get('LUMA_API_KEY'),
      // Replicate
      REPLICATE_API_TOKEN: this.configService.get('REPLICATE_API_TOKEN'),
      // Prodia
      PRODIA_API_KEY: this.configService.get('PRODIA_API_KEY'),
      // ElevenLabs
      ELEVENLABS_API_KEY: this.configService.get('ELEVENLABS_API_KEY'),
      // AssemblyAI
      ASSEMBLYAI_API_KEY: this.configService.get('ASSEMBLYAI_API_KEY'),
      // Deepgram
      DEEPGRAM_API_KEY: this.configService.get('DEEPGRAM_API_KEY'),
      // Gladia
      GLADIA_API_KEY: this.configService.get('GLADIA_API_KEY'),
      // LMNT
      LMNT_API_KEY: this.configService.get('LMNT_API_KEY'),
      // Rev.ai
      REVAI_API_KEY: this.configService.get('REVAI_API_KEY'),
      // Hume
      HUME_API_KEY: this.configService.get('HUME_API_KEY'),
      // Vercel AI Gateway
      VERCEL_AI_GATEWAY_URL: this.configService.get('VERCEL_AI_GATEWAY_URL'),
      // Open Responses
      OPEN_RESPONSES_API_KEY: this.configService.get('OPEN_RESPONSES_API_KEY'),
      // HuggingFace
      HUGGINGFACE_API_KEY: this.configService.get('HUGGINGFACE_API_KEY'),
      HUGGINGFACE_MODEL: this.configService.get('HUGGINGFACE_MODEL'),
      // Perplexity
      PERPLEXITY_API_KEY: this.configService.get('PERPLEXITY_API_KEY'),
      PERPLEXITY_MODEL: this.configService.get('PERPLEXITY_MODEL'),
    }
    const envConfig = getProviderConfig(providerId, env)

    // Get model from env or use default
    const model = (envConfig.model as string) || provider.defaultModel

    return {
      ...envConfig,
      model,
    } as ProviderConfig
  }

  async createModel(): Promise<LanguageModel> {
    const provider = this.getActiveProvider()
    const config = this.getProviderConfig(provider.id as AIProviderId)

    provider.validateConfig(config)

    return provider.createModel(config)
  }

  getAvailableProviders(): AIProviderId[] {
    return AI_PROVIDER_IDS
  }

  validateProvider(providerId: AIProviderId): { valid: boolean; error?: string } {
    try {
      const provider = this.getProvider(providerId)
      const config = this.getProviderConfig(providerId)
      provider.validateConfig(config)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

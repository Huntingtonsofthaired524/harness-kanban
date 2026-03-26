import { AIProviderId } from './ai-provider.types'

export interface AIProviderConfig {
  AI_PROVIDER: AIProviderId

  // OpenAI
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  OPENAI_BASE_URL?: string

  // Anthropic
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_MODEL?: string
  ANTHROPIC_BASE_URL?: string

  // Google Generative AI
  GOOGLE_GENERATIVE_API_KEY?: string
  GOOGLE_GENERATIVE_MODEL?: string

  // Google Vertex AI
  GOOGLE_VERTEX_PROJECT?: string
  GOOGLE_VERTEX_LOCATION?: string
  GOOGLE_VERTEX_MODEL?: string

  // Azure OpenAI
  AZURE_OPENAI_API_KEY?: string
  AZURE_OPENAI_RESOURCE_NAME?: string
  AZURE_OPENAI_DEPLOYMENT_NAME?: string
  AZURE_OPENAI_API_VERSION?: string

  // xAI
  XAI_API_KEY?: string
  XAI_MODEL?: string

  // DeepSeek
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_MODEL?: string

  // Mistral
  MISTRAL_API_KEY?: string
  MISTRAL_MODEL?: string

  // Cohere
  COHERE_API_KEY?: string
  COHERE_MODEL?: string

  // Bedrock
  BEDROCK_ACCESS_KEY_ID?: string
  BEDROCK_SECRET_ACCESS_KEY?: string
  BEDROCK_REGION?: string
  BEDROCK_MODEL?: string

  // Groq
  GROQ_API_KEY?: string
  GROQ_MODEL?: string

  // Cerebras
  CEREBRAS_API_KEY?: string
  CEREBRAS_MODEL?: string

  // Together
  TOGETHER_API_KEY?: string
  TOGETHER_MODEL?: string

  // Fireworks
  FIREWORKS_API_KEY?: string
  FIREWORKS_MODEL?: string

  // DeepInfra
  DEEPINFRA_API_KEY?: string
  DEEPINFRA_MODEL?: string

  // Baseten
  BASETEN_API_KEY?: string

  // Fal
  FAL_API_KEY?: string

  // Black Forest Labs
  BLACK_FOREST_LABS_API_KEY?: string

  // Luma
  LUMA_API_KEY?: string

  // Replicate
  REPLICATE_API_TOKEN?: string

  // Prodia
  PRODIA_API_KEY?: string

  // ElevenLabs
  ELEVENLABS_API_KEY?: string

  // AssemblyAI
  ASSEMBLYAI_API_KEY?: string

  // Deepgram
  DEEPGRAM_API_KEY?: string

  // Gladia
  GLADIA_API_KEY?: string

  // LMNT
  LMNT_API_KEY?: string

  // Rev.ai
  REVAI_API_KEY?: string

  // Hume
  HUME_API_KEY?: string

  // Vercel AI Gateway
  VERCEL_AI_GATEWAY_URL?: string

  // Open Responses
  OPEN_RESPONSES_API_KEY?: string

  // HuggingFace
  HUGGINGFACE_API_KEY?: string
  HUGGINGFACE_MODEL?: string

  // Perplexity
  PERPLEXITY_API_KEY?: string
  PERPLEXITY_MODEL?: string

  // Moonshot
  MOONSHOT_API_KEY?: string
  MOONSHOT_MODEL?: string
  MOONSHOT_BASE_URL?: string
}

export function getProviderConfig(
  providerId: AIProviderId,
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        baseURL: env.OPENAI_BASE_URL,
      }
    case 'anthropic':
      return {
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
        baseURL: env.ANTHROPIC_BASE_URL,
      }
    case 'google-generative':
      return {
        apiKey: env.GOOGLE_GENERATIVE_API_KEY,
        model: env.GOOGLE_GENERATIVE_MODEL,
      }
    case 'google-vertex':
      return {
        project: env.GOOGLE_VERTEX_PROJECT,
        location: env.GOOGLE_VERTEX_LOCATION,
        model: env.GOOGLE_VERTEX_MODEL,
      }
    case 'azure-openai':
      return {
        apiKey: env.AZURE_OPENAI_API_KEY,
        resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
        deploymentName: env.AZURE_OPENAI_DEPLOYMENT_NAME,
        apiVersion: env.AZURE_OPENAI_API_VERSION,
      }
    case 'xai':
      return {
        apiKey: env.XAI_API_KEY,
        model: env.XAI_MODEL,
      }
    case 'deepseek':
      return {
        apiKey: env.DEEPSEEK_API_KEY,
        model: env.DEEPSEEK_MODEL,
      }
    case 'mistral':
      return {
        apiKey: env.MISTRAL_API_KEY,
        model: env.MISTRAL_MODEL,
      }
    case 'cohere':
      return {
        apiKey: env.COHERE_API_KEY,
        model: env.COHERE_MODEL,
      }
    case 'bedrock':
      return {
        accessKeyId: env.BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: env.BEDROCK_SECRET_ACCESS_KEY,
        region: env.BEDROCK_REGION,
        model: env.BEDROCK_MODEL,
      }
    case 'groq':
      return {
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL,
      }
    case 'cerebras':
      return {
        apiKey: env.CEREBRAS_API_KEY,
        model: env.CEREBRAS_MODEL,
      }
    case 'together':
      return {
        apiKey: env.TOGETHER_API_KEY,
        model: env.TOGETHER_MODEL,
      }
    case 'fireworks':
      return {
        apiKey: env.FIREWORKS_API_KEY,
        model: env.FIREWORKS_MODEL,
      }
    case 'deepinfra':
      return {
        apiKey: env.DEEPINFRA_API_KEY,
        model: env.DEEPINFRA_MODEL,
      }
    case 'baseten':
      return {
        apiKey: env.BASETEN_API_KEY,
      }
    case 'fal':
      return {
        apiKey: env.FAL_API_KEY,
      }
    case 'black-forest-labs':
      return {
        apiKey: env.BLACK_FOREST_LABS_API_KEY,
      }
    case 'luma':
      return {
        apiKey: env.LUMA_API_KEY,
      }
    case 'replicate':
      return {
        apiKey: env.REPLICATE_API_TOKEN,
      }
    case 'prodia':
      return {
        apiKey: env.PRODIA_API_KEY,
      }
    case 'elevenlabs':
      return {
        apiKey: env.ELEVENLABS_API_KEY,
      }
    case 'assemblyai':
      return {
        apiKey: env.ASSEMBLYAI_API_KEY,
      }
    case 'deepgram':
      return {
        apiKey: env.DEEPGRAM_API_KEY,
      }
    case 'gladia':
      return {
        apiKey: env.GLADIA_API_KEY,
      }
    case 'lmnt':
      return {
        apiKey: env.LMNT_API_KEY,
      }
    case 'revai':
      return {
        apiKey: env.REVAI_API_KEY,
      }
    case 'hume':
      return {
        apiKey: env.HUME_API_KEY,
      }
    case 'vercel-ai-gateway':
      return {
        url: env.VERCEL_AI_GATEWAY_URL,
      }
    case 'open-responses':
      return {
        apiKey: env.OPEN_RESPONSES_API_KEY,
      }
    case 'huggingface':
      return {
        apiKey: env.HUGGINGFACE_API_KEY,
        model: env.HUGGINGFACE_MODEL,
      }
    case 'perplexity':
      return {
        apiKey: env.PERPLEXITY_API_KEY,
        model: env.PERPLEXITY_MODEL,
      }
    case 'moonshot':
      return {
        apiKey: env.MOONSHOT_API_KEY,
        model: env.MOONSHOT_MODEL,
        baseURL: env.MOONSHOT_BASE_URL,
      }
    default:
      return {}
  }
}

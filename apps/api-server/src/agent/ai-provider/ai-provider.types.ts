import { LanguageModel } from 'ai'

export interface ProviderConfig {
  apiKey?: string
  baseURL?: string
  model: string
  [key: string]: unknown
}

export interface AIProvider {
  readonly id: string
  readonly name: string
  readonly packageName: string
  readonly defaultModel: string

  validateConfig(config: ProviderConfig): void
  createModel(config: ProviderConfig): Promise<LanguageModel>
}

export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'google-generative'
  | 'google-vertex'
  | 'azure-openai'
  | 'xai'
  | 'deepseek'
  | 'mistral'
  | 'cohere'
  | 'bedrock'
  | 'groq'
  | 'cerebras'
  | 'together'
  | 'fireworks'
  | 'deepinfra'
  | 'baseten'
  | 'fal'
  | 'black-forest-labs'
  | 'luma'
  | 'replicate'
  | 'prodia'
  | 'elevenlabs'
  | 'assemblyai'
  | 'deepgram'
  | 'gladia'
  | 'lmnt'
  | 'revai'
  | 'hume'
  | 'vercel-ai-gateway'
  | 'open-responses'
  | 'huggingface'
  | 'perplexity'
  | 'moonshot'

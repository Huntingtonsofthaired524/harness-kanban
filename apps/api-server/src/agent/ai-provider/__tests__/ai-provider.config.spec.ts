import { getProviderConfig } from '../ai-provider.config'

describe('getProviderConfig', () => {
  it('should return OpenAI config', () => {
    const env = {
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
      OPENAI_BASE_URL: 'https://custom.openai.com',
    }

    const config = getProviderConfig('openai', env)

    expect(config).toEqual({
      apiKey: 'sk-test',
      model: 'gpt-4o',
      baseURL: 'https://custom.openai.com',
    })
  })

  it('should return Anthropic config', () => {
    const env = {
      ANTHROPIC_API_KEY: 'sk-ant-test',
      ANTHROPIC_MODEL: 'claude-3-opus',
      ANTHROPIC_BASE_URL: 'https://custom.anthropic.com',
    }

    const config = getProviderConfig('anthropic', env)

    expect(config).toEqual({
      apiKey: 'sk-ant-test',
      model: 'claude-3-opus',
      baseURL: 'https://custom.anthropic.com',
    })
  })

  it('should return Google Generative config', () => {
    const env = {
      GOOGLE_GENERATIVE_API_KEY: 'google-key',
      GOOGLE_GENERATIVE_MODEL: 'gemini-pro',
    }

    const config = getProviderConfig('google-generative', env)

    expect(config).toEqual({
      apiKey: 'google-key',
      model: 'gemini-pro',
    })
  })

  it('should return Google Vertex config', () => {
    const env = {
      GOOGLE_VERTEX_PROJECT: 'my-project',
      GOOGLE_VERTEX_LOCATION: 'us-west1',
      GOOGLE_VERTEX_MODEL: 'gemini-pro',
    }

    const config = getProviderConfig('google-vertex', env)

    expect(config).toEqual({
      project: 'my-project',
      location: 'us-west1',
      model: 'gemini-pro',
    })
  })

  it('should return Azure OpenAI config', () => {
    const env = {
      AZURE_OPENAI_API_KEY: 'azure-key',
      AZURE_OPENAI_RESOURCE_NAME: 'my-resource',
      AZURE_OPENAI_DEPLOYMENT_NAME: 'my-deployment',
      AZURE_OPENAI_API_VERSION: '2024-02-01',
    }

    const config = getProviderConfig('azure-openai', env)

    expect(config).toEqual({
      apiKey: 'azure-key',
      resourceName: 'my-resource',
      deploymentName: 'my-deployment',
      apiVersion: '2024-02-01',
    })
  })

  it('should return xAI config', () => {
    const env = {
      XAI_API_KEY: 'xai-key',
      XAI_MODEL: 'grok-1',
    }

    const config = getProviderConfig('xai', env)

    expect(config).toEqual({
      apiKey: 'xai-key',
      model: 'grok-1',
    })
  })

  it('should return DeepSeek config', () => {
    const env = {
      DEEPSEEK_API_KEY: 'deepseek-key',
      DEEPSEEK_MODEL: 'deepseek-chat',
    }

    const config = getProviderConfig('deepseek', env)

    expect(config).toEqual({
      apiKey: 'deepseek-key',
      model: 'deepseek-chat',
    })
  })

  it('should return Mistral config', () => {
    const env = {
      MISTRAL_API_KEY: 'mistral-key',
      MISTRAL_MODEL: 'mistral-large',
    }

    const config = getProviderConfig('mistral', env)

    expect(config).toEqual({
      apiKey: 'mistral-key',
      model: 'mistral-large',
    })
  })

  it('should return Cohere config', () => {
    const env = {
      COHERE_API_KEY: 'cohere-key',
      COHERE_MODEL: 'command-r',
    }

    const config = getProviderConfig('cohere', env)

    expect(config).toEqual({
      apiKey: 'cohere-key',
      model: 'command-r',
    })
  })

  it('should return Bedrock config', () => {
    const env = {
      BEDROCK_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
      BEDROCK_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      BEDROCK_REGION: 'us-west-2',
      BEDROCK_MODEL: 'anthropic.claude-v2',
    }

    const config = getProviderConfig('bedrock', env)

    expect(config).toEqual({
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-west-2',
      model: 'anthropic.claude-v2',
    })
  })

  it('should return Groq config', () => {
    const env = {
      GROQ_API_KEY: 'groq-key',
      GROQ_MODEL: 'llama2-70b',
    }

    const config = getProviderConfig('groq', env)

    expect(config).toEqual({
      apiKey: 'groq-key',
      model: 'llama2-70b',
    })
  })

  it('should return Cerebras config', () => {
    const env = {
      CEREBRAS_API_KEY: 'cerebras-key',
      CEREBRAS_MODEL: 'llama3-70b',
    }

    const config = getProviderConfig('cerebras', env)

    expect(config).toEqual({
      apiKey: 'cerebras-key',
      model: 'llama3-70b',
    })
  })

  it('should return Together config', () => {
    const env = {
      TOGETHER_API_KEY: 'together-key',
      TOGETHER_MODEL: 'llama-2-70b',
    }

    const config = getProviderConfig('together', env)

    expect(config).toEqual({
      apiKey: 'together-key',
      model: 'llama-2-70b',
    })
  })

  it('should return Fireworks config', () => {
    const env = {
      FIREWORKS_API_KEY: 'fireworks-key',
      FIREWORKS_MODEL: 'mixtral-8x7b',
    }

    const config = getProviderConfig('fireworks', env)

    expect(config).toEqual({
      apiKey: 'fireworks-key',
      model: 'mixtral-8x7b',
    })
  })

  it('should return DeepInfra config', () => {
    const env = {
      DEEPINFRA_API_KEY: 'deepinfra-key',
      DEEPINFRA_MODEL: 'llama-2-70b',
    }

    const config = getProviderConfig('deepinfra', env)

    expect(config).toEqual({
      apiKey: 'deepinfra-key',
      model: 'llama-2-70b',
    })
  })

  it('should return Baseten config', () => {
    const env = {
      BASETEN_API_KEY: 'baseten-key',
    }

    const config = getProviderConfig('baseten', env)

    expect(config).toEqual({
      apiKey: 'baseten-key',
    })
  })

  it('should return Fal config', () => {
    const env = {
      FAL_API_KEY: 'fal-key',
    }

    const config = getProviderConfig('fal', env)

    expect(config).toEqual({
      apiKey: 'fal-key',
    })
  })

  it('should return Black Forest Labs config', () => {
    const env = {
      BLACK_FOREST_LABS_API_KEY: 'bfl-key',
    }

    const config = getProviderConfig('black-forest-labs', env)

    expect(config).toEqual({
      apiKey: 'bfl-key',
    })
  })

  it('should return Luma config', () => {
    const env = {
      LUMA_API_KEY: 'luma-key',
    }

    const config = getProviderConfig('luma', env)

    expect(config).toEqual({
      apiKey: 'luma-key',
    })
  })

  it('should return Replicate config', () => {
    const env = {
      REPLICATE_API_TOKEN: 'r8-token',
    }

    const config = getProviderConfig('replicate', env)

    expect(config).toEqual({
      apiKey: 'r8-token',
    })
  })

  it('should return Prodia config', () => {
    const env = {
      PRODIA_API_KEY: 'prodia-key',
    }

    const config = getProviderConfig('prodia', env)

    expect(config).toEqual({
      apiKey: 'prodia-key',
    })
  })

  it('should return ElevenLabs config', () => {
    const env = {
      ELEVENLABS_API_KEY: 'elevenlabs-key',
    }

    const config = getProviderConfig('elevenlabs', env)

    expect(config).toEqual({
      apiKey: 'elevenlabs-key',
    })
  })

  it('should return AssemblyAI config', () => {
    const env = {
      ASSEMBLYAI_API_KEY: 'assemblyai-key',
    }

    const config = getProviderConfig('assemblyai', env)

    expect(config).toEqual({
      apiKey: 'assemblyai-key',
    })
  })

  it('should return Deepgram config', () => {
    const env = {
      DEEPGRAM_API_KEY: 'deepgram-key',
    }

    const config = getProviderConfig('deepgram', env)

    expect(config).toEqual({
      apiKey: 'deepgram-key',
    })
  })

  it('should return Gladia config', () => {
    const env = {
      GLADIA_API_KEY: 'gladia-key',
    }

    const config = getProviderConfig('gladia', env)

    expect(config).toEqual({
      apiKey: 'gladia-key',
    })
  })

  it('should return LMNT config', () => {
    const env = {
      LMNT_API_KEY: 'lmnt-key',
    }

    const config = getProviderConfig('lmnt', env)

    expect(config).toEqual({
      apiKey: 'lmnt-key',
    })
  })

  it('should return RevAI config', () => {
    const env = {
      REVAI_API_KEY: 'revai-key',
    }

    const config = getProviderConfig('revai', env)

    expect(config).toEqual({
      apiKey: 'revai-key',
    })
  })

  it('should return Hume config', () => {
    const env = {
      HUME_API_KEY: 'hume-key',
    }

    const config = getProviderConfig('hume', env)

    expect(config).toEqual({
      apiKey: 'hume-key',
    })
  })

  it('should return Vercel AI Gateway config', () => {
    const env = {
      VERCEL_AI_GATEWAY_URL: 'https://gateway.vercel.ai/v1',
    }

    const config = getProviderConfig('vercel-ai-gateway', env)

    expect(config).toEqual({
      url: 'https://gateway.vercel.ai/v1',
    })
  })

  it('should return Open Responses config', () => {
    const env = {
      OPEN_RESPONSES_API_KEY: 'open-responses-key',
    }

    const config = getProviderConfig('open-responses', env)

    expect(config).toEqual({
      apiKey: 'open-responses-key',
    })
  })

  it('should return HuggingFace config', () => {
    const env = {
      HUGGINGFACE_API_KEY: 'hf-key',
      HUGGINGFACE_MODEL: 'meta-llama/Llama-2-70b',
    }

    const config = getProviderConfig('huggingface', env)

    expect(config).toEqual({
      apiKey: 'hf-key',
      model: 'meta-llama/Llama-2-70b',
    })
  })

  it('should return Perplexity config', () => {
    const env = {
      PERPLEXITY_API_KEY: 'pplx-key',
      PERPLEXITY_MODEL: 'pplx-70b',
    }

    const config = getProviderConfig('perplexity', env)

    expect(config).toEqual({
      apiKey: 'pplx-key',
      model: 'pplx-70b',
    })
  })

  it('should return Moonshot config', () => {
    const env = {
      MOONSHOT_API_KEY: 'moonshot-key',
      MOONSHOT_MODEL: 'moonshot-v1-8k',
    }

    const config = getProviderConfig('moonshot', env)

    expect(config).toEqual({
      apiKey: 'moonshot-key',
      model: 'moonshot-v1-8k',
    })
  })

  it('should return empty object for unknown provider', () => {
    const env = {}

    const config = getProviderConfig('unknown' as never, env)

    expect(config).toEqual({})
  })

  it('should handle undefined env values', () => {
    const env = {
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: undefined,
    }

    const config = getProviderConfig('openai', env)

    expect(config).toEqual({
      apiKey: undefined,
      model: undefined,
      baseURL: undefined,
    })
  })
})

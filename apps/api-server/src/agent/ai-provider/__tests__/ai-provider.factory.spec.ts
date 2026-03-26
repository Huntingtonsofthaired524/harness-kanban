import { ConfigService } from '@nestjs/config'
import { AI_PROVIDER_IDS, DEFAULT_AI_PROVIDER } from '../ai-provider.constants'
import { AIProviderFactory } from '../ai-provider.factory'

// Mock all AI SDK provider packages
const mockCreateOpenAI = jest.fn()
const mockCreateAnthropic = jest.fn()
const mockCreateGoogleGenerativeAI = jest.fn()

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: (...args: unknown[]) => mockCreateOpenAI(...args),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: (...args: unknown[]) => mockCreateAnthropic(...args),
}))

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: (...args: unknown[]) => mockCreateGoogleGenerativeAI(...args),
}))

describe('AIProviderFactory', () => {
  let factory: AIProviderFactory
  let configService: ConfigService

  // Helper to create a valid-length API key for testing
  const createMockConfigService = (provider: string, config: Record<string, string> = {}) =>
    ({
      get: jest.fn((key: string) => {
        if (key === 'AI_PROVIDER') return provider
        return config[key]
      }),
    }) as unknown as ConfigService

  beforeEach(() => {
    mockCreateOpenAI.mockReset()
    mockCreateAnthropic.mockReset()
    mockCreateGoogleGenerativeAI.mockReset()

    // Setup mock implementations
    mockCreateOpenAI.mockReturnValue(jest.fn(() => ({ id: 'openai-model' })))
    mockCreateAnthropic.mockReturnValue(jest.fn(() => ({ id: 'anthropic-model' })))
    mockCreateGoogleGenerativeAI.mockReturnValue(jest.fn(() => ({ id: 'google-model' })))
  })

  describe('constructor', () => {
    it('should register all 33 providers', () => {
      configService = createMockConfigService('openai')
      factory = new AIProviderFactory(configService)

      const providers = factory.getAvailableProviders()
      expect(providers).toHaveLength(33)
      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
      expect(providers).toContain('google-generative')
      expect(providers).toContain('moonshot')
    })
  })

  describe('getActiveProviderId', () => {
    it('should return the configured provider when valid', () => {
      configService = createMockConfigService('anthropic')
      factory = new AIProviderFactory(configService)

      expect(factory.getActiveProviderId()).toBe('anthropic')
    })

    it('should return default provider when not configured', () => {
      configService = createMockConfigService('')
      factory = new AIProviderFactory(configService)

      expect(factory.getActiveProviderId()).toBe(DEFAULT_AI_PROVIDER)
    })

    it('should return default provider when invalid provider configured', () => {
      configService = createMockConfigService('invalid-provider')
      factory = new AIProviderFactory(configService)

      expect(factory.getActiveProviderId()).toBe(DEFAULT_AI_PROVIDER)
    })
  })

  describe('getProvider', () => {
    beforeEach(() => {
      configService = createMockConfigService('openai')
      factory = new AIProviderFactory(configService)
    })

    it('should return provider for valid ID', () => {
      const provider = factory.getProvider('openai')
      expect(provider.id).toBe('openai')
      expect(provider.name).toBe('OpenAI')
    })

    it('should throw error for unknown provider ID', () => {
      expect(() => factory.getProvider('unknown' as (typeof AI_PROVIDER_IDS)[number])).toThrow(
        'Unknown AI provider: unknown',
      )
    })
  })

  describe('getActiveProvider', () => {
    it('should return OpenAI provider when AI_PROVIDER=openai', () => {
      configService = createMockConfigService('openai')
      factory = new AIProviderFactory(configService)

      const provider = factory.getActiveProvider()
      expect(provider.id).toBe('openai')
      expect(provider.name).toBe('OpenAI')
    })

    it('should return Anthropic provider when AI_PROVIDER=anthropic', () => {
      configService = createMockConfigService('anthropic')
      factory = new AIProviderFactory(configService)

      const provider = factory.getActiveProvider()
      expect(provider.id).toBe('anthropic')
      expect(provider.name).toBe('Anthropic')
    })
  })

  describe('getProviderConfig', () => {
    beforeEach(() => {
      configService = createMockConfigService('openai', {
        OPENAI_API_KEY: 'sk-test123456789012345678901234567890',
        OPENAI_MODEL: 'gpt-4o',
      })
      factory = new AIProviderFactory(configService)
    })

    it('should return correct config for OpenAI provider', () => {
      const config = factory.getProviderConfig('openai')
      expect(config.apiKey).toBe('sk-test123456789012345678901234567890')
      expect(config.model).toBe('gpt-4o')
    })

    it('should use default model when not specified', () => {
      configService = createMockConfigService('openai', {})
      factory = new AIProviderFactory(configService)

      const config = factory.getProviderConfig('openai')
      expect(config.model).toBe('gpt-4o-mini')
    })
  })

  describe('createModel', () => {
    it('should create OpenAI model when AI_PROVIDER=openai', async () => {
      configService = createMockConfigService('openai', {
        OPENAI_API_KEY: 'sk-test123456789012345678901234567890',
        OPENAI_MODEL: 'gpt-4o-mini',
      })
      factory = new AIProviderFactory(configService)

      const model = await factory.createModel()

      expect(mockCreateOpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test123456789012345678901234567890',
        baseURL: undefined,
      })
      expect(model).toBeDefined()
    })

    it('should create Anthropic model when AI_PROVIDER=anthropic', async () => {
      configService = createMockConfigService('anthropic', {
        ANTHROPIC_API_KEY: 'sk-ant-test',
        ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
      })
      factory = new AIProviderFactory(configService)

      const model = await factory.createModel()

      expect(mockCreateAnthropic).toHaveBeenCalledWith({
        apiKey: 'sk-ant-test',
        baseURL: undefined,
      })
      expect(model).toBeDefined()
    })
  })

  describe('validateProvider', () => {
    beforeEach(() => {
      configService = createMockConfigService('openai', {
        OPENAI_API_KEY: 'sk-test123456789012345678901234567890',
      })
      factory = new AIProviderFactory(configService)
    })

    it('should return valid=true for properly configured provider', () => {
      const result = factory.validateProvider('openai')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid=false for unknown provider', () => {
      const result = factory.validateProvider('unknown' as (typeof AI_PROVIDER_IDS)[number])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown AI provider')
    })
  })

  describe('getAvailableProviders', () => {
    beforeEach(() => {
      configService = createMockConfigService('openai')
      factory = new AIProviderFactory(configService)
    })

    it('should return all 33 provider IDs', () => {
      const providers = factory.getAvailableProviders()
      expect(providers).toHaveLength(33)
      expect(providers).toEqual(AI_PROVIDER_IDS)
    })
  })
})

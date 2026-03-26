import { ChromaClient, Collection } from 'chromadb'

import {
  CHROMA_CLIENT_TOKEN,
  CHROMA_COLLECTIONS,
  ChromaCollectionName,
  DEFAULT_CHROMA_OPENAI_EMBEDDING_MODEL,
} from '@/chroma/chroma.constants'
import { OpenAIEmbeddingFunction } from '@chroma-core/openai'
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ChromaCollectionService implements OnModuleInit {
  private readonly logger = new Logger(ChromaCollectionService.name)
  private readonly collections = new Map<ChromaCollectionName, Collection>()
  private readonly embeddingFunction: OpenAIEmbeddingFunction

  constructor(
    @Inject(CHROMA_CLIENT_TOKEN) private readonly chromaClient: ChromaClient,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('EMBEDDING_OPENAI_API_KEY')?.trim()
    if (!apiKey) {
      throw new Error('EMBEDDING_OPENAI_API_KEY is required for Chroma OpenAI embeddings.')
    }

    const modelName =
      this.configService.get<string>('EMBEDDING_OPENAI_EMBEDDING_MODEL') ?? DEFAULT_CHROMA_OPENAI_EMBEDDING_MODEL

    this.embeddingFunction = new OpenAIEmbeddingFunction({
      apiKey,
      modelName,
    })
  }

  async onModuleInit(): Promise<void> {
    try {
      await Promise.all(Object.values(CHROMA_COLLECTIONS).map(name => this.ensureCollection(name)))
    } catch (error) {
      this.logger.warn(`Failed to initialize Chroma collections at startup: ${(error as Error).message}`)
    }
  }

  async getCollection(name: ChromaCollectionName): Promise<Collection> {
    if (this.collections.has(name)) {
      return this.collections.get(name)!
    }

    return this.ensureCollection(name)
  }

  private async ensureCollection(name: ChromaCollectionName): Promise<Collection> {
    const collection = await this.chromaClient.getOrCreateCollection({
      name,
      embeddingFunction: this.embeddingFunction,
    })
    this.collections.set(name, collection)
    this.logger.log(`Chroma collection ready: ${name}`)
    return collection
  }
}

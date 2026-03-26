import { ChromaClient } from 'chromadb'

import { CHROMA_CLIENT_TOKEN, DEFAULT_CHROMA_HOST, DEFAULT_CHROMA_PORT } from '@/chroma/chroma.constants'
import { ChromaCollectionService } from '@/chroma/chroma.service'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Module({
  providers: [
    {
      provide: CHROMA_CLIENT_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('CHROMA_HOST') ?? DEFAULT_CHROMA_HOST
        const port = Number(configService.get<string>('CHROMA_PORT') ?? DEFAULT_CHROMA_PORT)
        const ssl = configService.get<string>('CHROMA_SSL') === 'true'

        return new ChromaClient({
          host,
          port,
          ssl,
        })
      },
    },
    ChromaCollectionService,
  ],
  exports: [ChromaCollectionService, CHROMA_CLIENT_TOKEN],
})
export class ChromaModule {}

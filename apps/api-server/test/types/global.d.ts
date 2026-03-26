import { Server } from 'http'

import { INestApplication } from '@nestjs/common'

declare global {
  var __TEST_USER__: {
    email: string
    userId: string
  }
  var __APP__: INestApplication
  var __HTTP_SERVER__: Server
}

export {}

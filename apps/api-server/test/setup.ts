import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth'
import { getAuth } from '../src/auth/auth.js'
import { DatabaseModule } from '../src/database/database.module'

import request = require('supertest')

export default async function globalSetup() {
  console.log('Global setup: Starting...')

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      DatabaseModule,
      BetterAuthNestModule.forRootAsync({
        useFactory: async () => {
          const authInstance = await getAuth()
          return {
            auth: authInstance,
          }
        },
      }),
    ],
  }).compile()

  const app = moduleFixture.createNestApplication()
  await app.init()

  // Create a test user in global setup
  const response = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send({
    email: 'e2e-user@example.com',
    password: 'temppassword',
    name: 'E2E User',
    callbackURL: '/',
  })

  await app.close()
  console.log('Global setup: Done')
}

// Run if executed directly (not imported as a module)
const isMainModule = process.argv[1]?.includes('setup.ts')
if (isMainModule) {
  globalSetup().catch(console.error)
}

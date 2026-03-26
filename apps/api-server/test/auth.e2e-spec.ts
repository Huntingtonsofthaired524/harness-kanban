import { AppModule } from '@/app.module'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { loginUser, SupertestAgent } from './utils/auth-helper'

describe('UserController (e2e)', () => {
  let app: INestApplication
  let agent: SupertestAgent

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Login the test user created in global setup
    agent = await loginUser(app, 'e2e-user@example.com', 'temppassword')
  })

  afterAll(async () => {
    await app.close()
  })

  it('should access protected route with cookie', async () => {
    await agent.get('/api/v1/issues').expect(200)
  })
})

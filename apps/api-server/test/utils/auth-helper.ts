import { INestApplication } from '@nestjs/common'

import request = require('supertest')

export type SupertestAgent = ReturnType<typeof request.agent>

/**
 * Login a user using the email/password credentials.
 * Returns a supertest agent with the session cookie set.
 */
export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
  rememberMe = true,
): Promise<SupertestAgent> {
  const agent = request.agent(app.getHttpServer())

  await agent
    .post('/api/auth/sign-in/email')
    .send({
      email,
      password,
      rememberMe,
    })
    .expect(200)

  return agent
}

/**
 * Create a supertest agent for making authenticated requests.
 * The agent persists cookies across requests.
 */
export function createAgent(app: INestApplication): SupertestAgent {
  return request.agent(app.getHttpServer())
}

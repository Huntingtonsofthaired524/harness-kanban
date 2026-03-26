import { getTrustedOrigins } from '@/auth/auth-origins'
import { UserType } from '@/user/constants/user.constants'
import { prisma } from '@repo/database'

let auth: any
let authInitialized = false

async function initializeAuth() {
  const { betterAuth } = await import('better-auth')
  const { prismaAdapter } = await import('better-auth/adapters/prisma')

  auth = betterAuth({
    user: {
      additionalFields: {
        type: {
          type: 'string',
          required: false,
          defaultValue: UserType.USER,
          input: false,
        },
      },
    },
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: getTrustedOrigins(),
  })

  authInitialized = true
  return auth
}

const authPromise = initializeAuth()

export const getAuth = async () => {
  if (!authInitialized) {
    await authPromise
  }
  return auth!
}

export { authPromise as auth }

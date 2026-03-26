import { createHash, randomBytes } from 'crypto'

import { PrismaService } from '@/database/prisma.service'
import { SystemBotId } from '@/user/constants/user.constants'
import { UserService } from '@/user/user.service'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { AuthContext } from '@/auth/types/auth.types'
import type { Request } from 'express'

@Injectable()
export class OpenApiService {
  private readonly AUTH_HEADER_PREFIX = 'Bearer '
  private readonly API_KEY_VERSION_ONE = 1
  private readonly API_KEY_PREFIX_BASE = 'sk'
  private readonly PREFIX_RANDOM_BYTE_LENGTH = 4
  private readonly SECRET_BYTE_LENGTH = 24

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async validateOpenApiRequestAndGetContext(request: Request): Promise<AuthContext | null> {
    try {
      const userId = await this.validateApiKey(request)
      const users = await this.userService.getSpecifiedUsers([userId])
      if (users.length === 0) {
        throw new UnauthorizedException('OpenAPI authentication validation failed')
      }
      return { user: users[0] }
    } catch (error) {
      console.error('Error validating OpenAPI request:', error)

      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error
      }

      // For other errors, throw a generic auth error
      throw new UnauthorizedException('OpenAPI authentication validation failed')
    }
  }

  async validateApiKey(request: Request): Promise<string> {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith(this.AUTH_HEADER_PREFIX)) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const apiKey = authHeader.substring(this.AUTH_HEADER_PREFIX.length)
    const prefix = this.extractPrefixFromApiKey(apiKey)
    if (!prefix) {
      throw new UnauthorizedException('Invalid API key format')
    }

    const apiKeyRecord = await this.prisma.client.api_key.findUnique({
      where: { prefix },
    })
    if (!apiKeyRecord) {
      throw new UnauthorizedException('API key not found')
    }

    const hashedKey = createHash('sha256').update(apiKey).digest('hex')
    if (hashedKey !== apiKeyRecord.hashed_key) {
      throw new UnauthorizedException('Invalid API key')
    }

    if (apiKeyRecord.expires_at && new Date() > apiKeyRecord.expires_at) {
      throw new UnauthorizedException('API key has expired')
    }

    return SystemBotId.OPENAPI
  }

  private extractPrefixFromApiKey(apiKey: string): string | null {
    const parts = apiKey.split('-')
    if (parts.length < 3 || parts[0] !== this.API_KEY_PREFIX_BASE || !parts[1]?.startsWith('v')) {
      return null
    }
    const version = parts[1].substring(1)
    if (!/^\d+$/.test(version)) {
      return null
    }
    const prefixRandomPartLength = this.PREFIX_RANDOM_BYTE_LENGTH * 2
    const prefix = `${parts[0]}-${parts[1]}-${parts[2]?.substring(0, prefixRandomPartLength) || ''}`
    return prefix
  }

  generateApiKey(): {
    apiKey: string
    hashedKey: string
    prefix: string
  } {
    // Generate the public prefix, e.g., "sk-v1-9f5d3a1b"
    const prefixRandomPart = randomBytes(this.PREFIX_RANDOM_BYTE_LENGTH).toString('hex')
    const prefix = `${this.API_KEY_PREFIX_BASE}-v${this.API_KEY_VERSION_ONE}-${prefixRandomPart}`

    // Generate the secret part
    const secret = randomBytes(this.SECRET_BYTE_LENGTH).toString('hex')

    // Combine them to form the full key
    const apiKey = `${prefix}${secret}`

    // Hash the full key for database storage
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    return { apiKey, hashedKey, prefix }
  }
}

import { createHash, randomBytes } from 'crypto'

const API_KEY_VERSION_ONE = 1
const API_KEY_PREFIX_BASE = 'sk'
const PREFIX_RANDOM_BYTE_LENGTH = 4
const SECRET_BYTE_LENGTH = 24

export function generateApiKey(): {
  apiKey: string
  hashedKey: string
  prefix: string
} {
  // Generate the public prefix, e.g., "sk-v1-9f5d3a1b"
  const prefixRandomPart = randomBytes(PREFIX_RANDOM_BYTE_LENGTH).toString('hex')
  const prefix = `${API_KEY_PREFIX_BASE}-v${API_KEY_VERSION_ONE}-${prefixRandomPart}`

  // Generate the secret part
  const secret = randomBytes(SECRET_BYTE_LENGTH).toString('hex')

  // Combine them to form the full key
  const apiKey = `${prefix}${secret}`

  // Hash the full key for database storage
  const hashedKey = createHash('sha256').update(apiKey).digest('hex')

  return { apiKey, hashedKey, prefix }
}

export function extractPrefixFromApiKey(apiKey: string): string | null {
  const parts = apiKey.split('-')
  if (parts.length < 3 || parts[0] !== API_KEY_PREFIX_BASE || !parts[1]?.startsWith('v')) {
    return null
  }
  const version = parts[1].substring(1)
  if (!/^\d+$/.test(version)) {
    return null
  }
  const prefixRandomPartLength = PREFIX_RANDOM_BYTE_LENGTH * 2
  const prefix = `${parts[0]}-${parts[1]}-${parts[2]?.substring(0, prefixRandomPartLength) || ''}`
  return prefix
}

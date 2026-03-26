import { createHash } from 'crypto'
import { describe, expect, it } from 'vitest'

import { generateApiKey } from '../secret'

describe('generateApiKey', () => {
  it('should generate an API key with the correct and expected format', () => {
    const SECRET_HEX_LENGTH = 48
    const HASHED_KEY_HEX_LENGTH = 64
    const PREFIX_REGEX = /^sk-v1-[0-9a-f]{8}$/
    const SECRET_PART_REGEX = /^[0-9a-f]{48}$/
    const HASHED_KEY_REGEX = /^[0-9a-f]{64}$/

    const { apiKey, hashedKey, prefix } = generateApiKey()

    // 1. Validate prefix format
    expect(prefix).toMatch(PREFIX_REGEX)

    // 2. Validate full API key structure
    expect(apiKey.startsWith(prefix)).toBe(true)
    expect(apiKey.length).toBe(prefix.length + SECRET_HEX_LENGTH)

    // 3. Validate the secret part of the key
    const secretPart = apiKey.substring(prefix.length)
    expect(secretPart).toMatch(SECRET_PART_REGEX)

    // 4. Validate hashed key format
    expect(hashedKey).toMatch(HASHED_KEY_REGEX)
    expect(hashedKey.length).toBe(HASHED_KEY_HEX_LENGTH)

    // 5. Verify the hash integrity
    const expectedHashedKey = createHash('sha256').update(apiKey).digest('hex')
    expect(hashedKey).toBe(expectedHashedKey)
  })

  it('should generate unique keys on each subsequent call', () => {
    const firstKeySet = generateApiKey()
    const secondKeySet = generateApiKey()

    expect(firstKeySet.apiKey).not.toBe(secondKeySet.apiKey)
    expect(firstKeySet.prefix).not.toBe(secondKeySet.prefix)
    expect(firstKeySet.hashedKey).not.toBe(secondKeySet.hashedKey)
  })
})

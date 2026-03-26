import { describe, expect, it } from 'vitest'

import { checkTimestampPrecision } from '@repo/shared/lib/utils/datetime'

describe('checkTimestampPrecision', () => {
  it('should correctly identify millisecond timestamps', () => {
    // Valid millisecond timestamps
    expect(checkTimestampPrecision(1623456789123, 'millisecond')).toBe(true)
    expect(checkTimestampPrecision(1000000000000, 'millisecond')).toBe(true)
    expect(checkTimestampPrecision(9999999999999, 'millisecond')).toBe(true)

    // Invalid millisecond timestamp (too small)
    expect(checkTimestampPrecision(999999999999, 'millisecond')).toBe(false)

    // Invalid millisecond timestamp (too large)
    expect(checkTimestampPrecision(10000000000000, 'millisecond')).toBe(false)
  })

  it('should correctly identify second timestamps', () => {
    // Valid second timestamps
    expect(checkTimestampPrecision(1623456789, 'second')).toBe(true)
    expect(checkTimestampPrecision(1000000000, 'second')).toBe(true)
    expect(checkTimestampPrecision(9999999999, 'second')).toBe(true)

    // Invalid second timestamp (too small)
    expect(checkTimestampPrecision(999999999, 'second')).toBe(false)

    // Invalid second timestamp (too large)
    expect(checkTimestampPrecision(10000000000, 'second')).toBe(false)
  })

  it('should reject second timestamps when unit is millisecond', () => {
    expect(checkTimestampPrecision(1623456789, 'millisecond')).toBe(false)
  })

  it('should reject millisecond timestamps when unit is second', () => {
    expect(checkTimestampPrecision(1623456789123, 'second')).toBe(false)
  })
})

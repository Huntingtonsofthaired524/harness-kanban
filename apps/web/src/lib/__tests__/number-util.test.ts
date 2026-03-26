import { describe, expect, it } from 'vitest'

import { checkPrecision } from '@repo/shared/lib/utils/number'

describe('checkPrecision', () => {
  it('should return true when the number of decimal places is within the specified precision', () => {
    expect(checkPrecision(1.23, 2)).toBe(true)
    expect(checkPrecision(1.2345, 4)).toBe(true)
    expect(checkPrecision(1, 0)).toBe(true)
    expect(checkPrecision(1.0, 1)).toBe(true)
    expect(checkPrecision(1.23, 3)).toBe(true)
    expect(checkPrecision(100, 2)).toBe(true)
    expect(checkPrecision(0, 5)).toBe(true)
  })

  it('should return false when the number of decimal places exceeds the specified precision', () => {
    expect(checkPrecision(1.23, 1)).toBe(false)
    expect(checkPrecision(1.2345, 3)).toBe(false)
    expect(checkPrecision(1.1, 0)).toBe(false)
  })

  it('should correctly handle floating point precision issues', () => {
    expect(checkPrecision(0.1 + 0.2, 1)).toBe(false)
    expect(checkPrecision(0.3, 1)).toBe(true)
  })
})

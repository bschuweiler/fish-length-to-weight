import { describe, it, expect } from 'vitest'
import {
  isQuarterValue,
  normalizeLength,
  lengthToWeight,
  validLengthsFor,
  formatLbOz,
  SPECIES_DETAILS,
} from './fishweight.js'

describe('isQuarterValue', () => {
  it('accepts whole and quarter values', () => {
    for (const v of [18, 18.25, 18.5, 18.75, 21.0]) {
      expect(isQuarterValue(v)).toBe(true)
    }
  })

  it('rejects non-quarter values', () => {
    for (const v of [18.1, 18.26, 18.875, 18.625]) {
      expect(isQuarterValue(v)).toBe(false)
    }
  })
})

describe('normalizeLength', () => {
  it('strips trailing zeros and a trailing dot', () => {
    expect(normalizeLength('23.50')).toBe('23.5')
    expect(normalizeLength('21.00')).toBe('21')
    expect(normalizeLength('20.500')).toBe('20.5')
    expect(normalizeLength('16.75')).toBe('16.75')
    expect(normalizeLength('14')).toBe('14')
  })
})

describe('lengthToWeight', () => {
  it('throws on invalid species', () => {
    for (const s of ['Bass', 'Walleye', 'Northern', 'Pike', '', null]) {
      expect(() => lengthToWeight(s, '23.25')).toThrow(/Species is not one of/)
    }
  })

  it('throws on non-numeric length', () => {
    expect(() => lengthToWeight('walleye', null)).toThrow(/not a number/)
  })

  it('throws on out-of-bounds length', () => {
    expect(() => lengthToWeight('walleye', SPECIES_DETAILS.walleye.lower - 0.25)).toThrow(/outside reasonable bounds/)
    expect(() => lengthToWeight('walleye', SPECIES_DETAILS.walleye.upper + 0.25)).toThrow(/outside reasonable bounds/)
  })

  it('throws on non-quarter-inch length', () => {
    for (const v of [18.1, 18.26, 18.875, 18.625]) {
      expect(() => lengthToWeight('walleye', v)).toThrow(/not whole or quarter value/)
    }
  })

  it('returns exact power curve value for each species', () => {
    for (const [species, length] of [
      ['walleye', 20], ['northern', 30], ['bass', 17],
      ['crappie', 12], ['trout', 14], ['sunfish', 10], ['muskie', 50],
    ]) {
      const { a, b } = SPECIES_DETAILS[species]
      expect(lengthToWeight(species, String(length)).weight).toBe(a * Math.pow(length, b))
    }
  })

  it('returns correct shape', () => {
    const r = lengthToWeight('walleye', '20')
    expect(r.species).toBe('walleye')
    expect(r.length).toBe('20')
    expect(typeof r.weight).toBe('number')
  })

  it('normalizes trailing-zero lengths', () => {
    expect(() => lengthToWeight('walleye', '20.500')).not.toThrow()
    expect(lengthToWeight('walleye', '21.5').length).toBe('21.5')
    const { a, b } = SPECIES_DETAILS.walleye
    expect(lengthToWeight('walleye', '20.500').weight).toBe(a * Math.pow(20.5, b))
  })

  it('quarter-inch weight falls strictly between adjacent whole-inch weights', () => {
    const w20   = lengthToWeight('walleye', '20').weight
    const w2025 = lengthToWeight('walleye', '20.25').weight
    const w21   = lengthToWeight('walleye', '21').weight
    expect(w2025).toBeGreaterThan(w20)
    expect(w2025).toBeLessThan(w21)
  })
})

describe('validLengthsFor', () => {
  it('starts and ends at species bounds', () => {
    const lengths = validLengthsFor('walleye')
    expect(lengths[0]).toBe(SPECIES_DETAILS.walleye.lower)
    expect(lengths[lengths.length - 1]).toBe(SPECIES_DETAILS.walleye.upper)
  })

  it('increments by 0.25', () => {
    const lengths = validLengthsFor('walleye')
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i] - lengths[i - 1]).toBeCloseTo(0.25, 5)
    }
  })

  it('returns empty array for unknown species', () => {
    expect(validLengthsFor('unknown')).toEqual([])
  })
})

describe('formatLbOz', () => {
  it('converts decimal pounds to lb + oz with hundredths', () => {
    expect(formatLbOz(4.917).text).toBe('4 lb 14.67 oz')
    expect(formatLbOz(1.5).text).toBe('1 lb 8.00 oz')
  })

  it('renders whole pounds as "N lb 0.00 oz"', () => {
    expect(formatLbOz(3).text).toBe('3 lb 0.00 oz')
  })

  it('rolls oz up into the next pound when toFixed(2) reaches 16.00', () => {
    expect(formatLbOz(4.9996875).text).toBe('5 lb 0.00 oz')
  })

  it('renders nullish input as a dash', () => {
    expect(formatLbOz(null).text).toBe('—')
  })
})

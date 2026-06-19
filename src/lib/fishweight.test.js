import { describe, it, expect } from 'vitest'
import {
  convertibleToFloat,
  isQuarterValue,
  normalizeLength,
  checkArgs,
  lengthToWeight,
  validLengthsFor,
  formatLbOz,
  SPECIES_DETAILS,
} from './fishweight.js'

describe('convertibleToFloat', () => {
  it('accepts numeric values and numeric strings', () => {
    for (const v of [17, 17.0, 28.25, 16.5, 44.75, '23.75', '21', '16.50']) {
      expect(convertibleToFloat(v)).toBe(true)
    }
  })

  it('rejects non-numeric values', () => {
    for (const v of ['something', ';$%', '', null, undefined]) {
      expect(convertibleToFloat(v)).toBe(false)
    }
  })
})

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

describe('checkArgs', () => {
  it('accepts valid species + lengths', () => {
    expect(() => checkArgs('walleye', '23.25')).not.toThrow()
    expect(() => checkArgs('walleye', '14')).not.toThrow()
    expect(() => checkArgs('northern', '28.5')).not.toThrow()
    expect(() => checkArgs('smallmouth', '7.5')).not.toThrow()
    // bounds are inclusive
    expect(() => checkArgs('walleye', SPECIES_DETAILS.walleye.lower)).not.toThrow()
    expect(() => checkArgs('walleye', SPECIES_DETAILS.walleye.upper)).not.toThrow()
  })

  it('rejects invalid / wrong-case species', () => {
    for (const s of ['Small mouth', 'Walleye', 'Northern', 'Pike', '', null]) {
      expect(() => checkArgs(s, '23.25')).toThrow(/Species is not one of/)
    }
  })

  it('rejects out-of-bounds lengths', () => {
    expect(() => checkArgs('walleye', SPECIES_DETAILS.walleye.lower - 0.25)).toThrow(
      /outside reasonable bounds/
    )
    expect(() => checkArgs('walleye', SPECIES_DETAILS.walleye.upper + 0.25)).toThrow(
      /outside reasonable bounds/
    )
    expect(() => checkArgs('smallmouth', SPECIES_DETAILS.smallmouth.upper + 2.75)).toThrow(
      /outside reasonable bounds/
    )
  })

  it('rejects non-numeric lengths', () => {
    expect(() => checkArgs('walleye', null)).toThrow(/not a number/)
  })

  it('rejects non whole/quarter lengths', () => {
    for (const v of [18.1, 18.26, 18.875, 18.625]) {
      expect(() => checkArgs('walleye', v)).toThrow(/not whole or quarter value/)
    }
  })
})

describe('lengthToWeight', () => {
  it('returns correct values and average for walleye 23.75', () => {
    const result = lengthToWeight('walleye', '23.75')
    expect(result.species).toBe('walleye')
    expect(result.length).toBe('23.75')
    expect(result.weights['MN DNR Table']).toBe(5.225)
    expect(result.weights['Catch & Release Formulas (WI and IA DNR)']).toBe(4.962)
    expect(result.weights['ND DNR Table']).toBe(4.95)
    expect(result.weights['NY DEC Table']).toBe(4.531)
    expect(result.average).toBeCloseTo(4.917, 3)
    expect(result.tableCount).toBe(4)
  })

  it('averages only the non-null tables', () => {
    // walleye "8": MN null, CR 0.19, ND 0.2, NY null  -> avg of 2
    const result = lengthToWeight('walleye', '8')
    expect(result.weights['MN DNR Table']).toBeNull()
    expect(result.weights['NY DEC Table']).toBeNull()
    expect(result.tableCount).toBe(2)
    expect(result.average).toBeCloseTo((0.19 + 0.2) / 2, 6)
  })

  it('normalizes trailing-zero lengths before lookup', () => {
    expect(() => lengthToWeight('walleye', '20.500')).not.toThrow()
    expect(lengthToWeight('walleye', '21.5').length).toBe('21.5')
  })

  it('handles happy paths across species', () => {
    expect(() => lengthToWeight('northern', '22.25')).not.toThrow()
    expect(() => lengthToWeight('smallmouth', '17.0')).not.toThrow()
  })
})

describe('validLengthsFor', () => {
  it('returns sorted numeric lengths within the species range', () => {
    const lengths = validLengthsFor('walleye')
    expect(lengths[0]).toBe(8)
    expect(lengths[lengths.length - 1]).toBe(35)
    // sorted ascending
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeGreaterThan(lengths[i - 1])
    }
  })
})

describe('formatLbOz', () => {
  it('converts decimal pounds to lb + oz', () => {
    expect(formatLbOz(4.917).text).toBe('4 lb 15 oz')
    expect(formatLbOz(1.5).text).toBe('1 lb 8 oz')
  })

  it('renders whole pounds as "N lb 0 oz"', () => {
    expect(formatLbOz(3).text).toBe('3 lb 0 oz')
  })

  it('rolls 16 oz up into the next pound', () => {
    // 4.97 -> 0.97*16 = 15.52 -> rounds to 16 -> 5 lb 0 oz
    expect(formatLbOz(4.97).text).toBe('5 lb 0 oz')
  })

  it('renders nullish input as a dash', () => {
    expect(formatLbOz(null).text).toBe('—')
  })
})

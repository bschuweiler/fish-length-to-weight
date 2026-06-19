/**
 * Fish length-to-weight lookup.
 *
 * JavaScript port of the original Python `fishweight.py`. The lookup tables are
 * pre-computed (including quarter-inch interpolated values) and bundled as JSON;
 * this module is a pure lookup + non-null average, with the same validation rules.
 */
import walleye from '../data/walleye.json'
import northern from '../data/northern.json'
import smallmouth from '../data/smallmouth.json'

// Ordered list of supported species keys (lowercase, as used in the data).
export const SPECIES = ['walleye', 'northern', 'smallmouth']

// Per-species inclusive length bounds (inches) + the bundled lookup data.
export const SPECIES_DETAILS = {
  walleye: { label: 'Walleye', lower: 8, upper: 35, data: walleye },
  northern: { label: 'Northern Pike', lower: 12, upper: 54, data: northern },
  smallmouth: { label: 'Smallmouth Bass', lower: 6, upper: 25, data: smallmouth },
}

// The four source tables. `lookup` is the data key; `label` is the display name.
// (The original Python mislabelled this "Forumlas"; corrected to "Formulas" here.)
export const CONVERSION_SYSTEMS = [
  { lookup: 'MN', label: 'MN DNR Table' },
  { lookup: 'CR', label: 'Catch & Release Formulas (WI and IA DNR)' },
  { lookup: 'ND', label: 'ND DNR Table' },
  { lookup: 'NY', label: 'NY DEC Table' },
]

/** True if `value` parses as a finite number. */
export function convertibleToFloat(value) {
  if (value === null || value === undefined || value === '') return false
  return !Number.isNaN(Number(value))
}

/** True if `n` is a whole or quarter-inch value (multiple of 0.25). */
export function isQuarterValue(n) {
  // 0.25/0.5/0.75 are exactly representable in IEEE-754, so this is exact.
  return Number(n) % 0.25 === 0
}

/**
 * Normalize a length to its lookup-table key: strip trailing zeros and a
 * trailing decimal point so "23.50" -> "23.5" and "21.00" -> "21".
 */
export function normalizeLength(length) {
  let s = String(length)
  if (s.includes('.')) {
    s = s.replace(/0+$/, '').replace(/\.$/, '')
  }
  return s
}

/**
 * Validate arguments. Throws an Error (mirroring the Python ValueError messages
 * and order) when species or length are invalid. Returns nothing on success.
 */
export function checkArgs(species, length) {
  if (!SPECIES.includes(species)) {
    throw new Error(`Species is not one of ${JSON.stringify(SPECIES)}`)
  }

  // Check number-ness first because the remaining checks treat length as a float.
  if (!convertibleToFloat(length)) {
    throw new Error('Length argument is not a number')
  }

  const lengthAsFloat = Number(length)

  const { lower, upper } = SPECIES_DETAILS[species]
  if (!(lengthAsFloat >= lower && lengthAsFloat <= upper)) {
    throw new Error(
      `Length argument is outside reasonable bounds of ${lower} and ${upper}`
    )
  }

  if (!isQuarterValue(lengthAsFloat)) {
    throw new Error('Length argument is not whole or quarter value')
  }
}

/**
 * Look up estimated weights for a species + length.
 *
 * @returns {{species: string, length: string, weights: Object, average: number}}
 *   `weights` maps each table's display label to its value (or null if the table
 *   has no value at that length). `average` is the arithmetic mean of the
 *   non-null table values, in decimal pounds.
 * @throws if arguments are invalid or no record exists for the length.
 */
export function lengthToWeight(species, length) {
  checkArgs(species, length)

  const key = normalizeLength(length)
  const record = SPECIES_DETAILS[species].data[key]
  if (!record) {
    throw new Error(`No results in ${species} table for length "${key}"`)
  }

  const weights = {}
  const values = []
  for (const { lookup, label } of CONVERSION_SYSTEMS) {
    const value = record[lookup] ?? null
    weights[label] = value
    if (value !== null && value !== undefined) {
      values.push(Number(value))
    }
  }

  const average = values.reduce((sum, v) => sum + v, 0) / values.length

  return { species, length: key, weights, average, tableCount: values.length }
}

/**
 * Sorted ascending list of valid length values (numbers) present in a species'
 * data. Used to drive the whole-inch picker and which fractions are selectable.
 */
export function validLengthsFor(species) {
  const data = SPECIES_DETAILS[species]?.data
  if (!data) return []
  return Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b)
}

/**
 * Convert decimal pounds to pounds + ounces, rounding ounces to the nearest
 * whole and rolling 16 oz up into the next pound.
 *
 * @returns {{lb: number, oz: number, text: string}}
 */
export function formatLbOz(pounds) {
  if (pounds === null || pounds === undefined || Number.isNaN(Number(pounds))) {
    return { lb: 0, oz: 0, text: '—' }
  }
  let lb = Math.floor(pounds)
  let oz = Math.round((pounds - lb) * 16)
  if (oz === 16) {
    lb += 1
    oz = 0
  }
  return { lb, oz, text: `${lb} lb ${oz} oz` }
}

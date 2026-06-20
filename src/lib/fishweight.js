export const SPECIES = ['walleye', 'northern', 'bass', 'crappie', 'trout', 'sunfish', 'muskie']

const CURVES = {
  walleye:  { a: 0.0002216374419091907,   b: 3.1412298634744915  },
  northern: { a: 0.00012406269747891442,  b: 3.165326888190031   },
  bass:     { a: 0.000489565638832141,    b: 3.078634332927227   },
  crappie:  { a: 0.00034746685514873833,  b: 3.2341739421490288  },
  trout:    { a: 0.0004903976481472857,   b: 2.9270130438062596  },
  sunfish:  { a: 0.000898156174180338,    b: 2.980274259434065   },
  muskie:   { a: 0.000047817510626631486, b: 3.4430159361118586  },
}

export const SPECIES_DETAILS = {
  walleye:  { label: 'Walleye',       lower: 14, upper: 28, ...CURVES.walleye  },
  northern: { label: 'Northern Pike', lower: 18, upper: 40, ...CURVES.northern },
  bass:     { label: 'Bass',          lower: 12, upper: 23, ...CURVES.bass     },
  crappie:  { label: 'Crappie',       lower: 8,  upper: 17, ...CURVES.crappie  },
  trout:    { label: 'Trout',         lower: 8,  upper: 18, ...CURVES.trout    },
  sunfish:  { label: 'Sunfish',       lower: 6,  upper: 14, ...CURVES.sunfish  },
  muskie:   { label: 'Muskellunge',   lower: 48, upper: 56, ...CURVES.muskie   },
}

/** True if `n` is a whole or quarter-inch value (multiple of 0.25). */
export function isQuarterValue(n) {
  return Number(n) % 0.25 === 0
}

export function normalizeLength(length) {
  let s = String(length)
  if (s.includes('.')) {
    s = s.replace(/0+$/, '').replace(/\.$/, '')
  }
  return s
}

export function lengthToWeight(species, length) {
  if (!SPECIES.includes(species)) {
    throw new Error(`Species is not one of ${JSON.stringify(SPECIES)}`)
  }

  const lengthAsFloat = Number(length)

  if (length == null || !Number.isFinite(lengthAsFloat)) {
    throw new Error('Length argument is not a number')
  }

  const { lower, upper } = SPECIES_DETAILS[species]
  if (lengthAsFloat < lower || lengthAsFloat > upper) {
    throw new Error(`Length argument is outside reasonable bounds of ${lower} and ${upper}`)
  }

  if (!isQuarterValue(lengthAsFloat)) {
    throw new Error('Length argument is not whole or quarter value')
  }

  const key = normalizeLength(length)
  const { a, b } = SPECIES_DETAILS[species]
  const weight = a * Math.pow(Number(key), b)
  return { species, length: key, weight }
}

export function validLengthsFor(species) {
  const details = SPECIES_DETAILS[species]
  if (!details) return []
  const { lower, upper } = details
  const steps = Math.round((upper - lower) / 0.25)
  const lengths = []
  for (let i = 0; i <= steps; i++) {
    lengths.push(lower + i * 0.25)
  }
  return lengths
}

export function formatLbOz(pounds) {
  if (pounds === null || pounds === undefined || Number.isNaN(Number(pounds))) {
    return { lb: 0, oz: 0, text: '—' }
  }
  let lb = Math.floor(pounds)
  const ozStr = ((pounds - lb) * 16).toFixed(2)
  if (parseFloat(ozStr) >= 16) {
    lb += 1
    return { lb, oz: 0, text: `${lb} lb 0.00 oz` }
  }
  return { lb, oz: parseFloat(ozStr), text: `${lb} lb ${ozStr} oz` }
}

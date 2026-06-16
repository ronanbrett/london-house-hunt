import { describe, expect, it } from 'vitest'
import {
  median,
  quantileSorted,
  summarisePrices,
  valueScore,
  verdictFromDelta,
} from '../../../server/services/value/verdict'

describe('quantileSorted / median', () => {
  it('interpolates', () => {
    expect(quantileSorted([10, 20, 30, 40], 0.5)).toBe(25)
    expect(median([3, 1, 2])).toBe(2)
  })
})

describe('summarisePrices', () => {
  it('returns median and IQR', () => {
    expect(summarisePrices([100, 200, 300, 400])).toEqual({
      sampleSize: 4,
      median: 250,
      iqrLow: 175,
      iqrHigh: 325,
    })
  })
  it('returns null for empty input', () => {
    expect(summarisePrices([])).toBeNull()
  })
})

describe('verdictFromDelta', () => {
  it('bands the delta', () => {
    expect(verdictFromDelta(-0.15)).toBe('underpriced')
    expect(verdictFromDelta(-0.05)).toBe('slightly_below')
    expect(verdictFromDelta(0)).toBe('fair')
    expect(verdictFromDelta(0.05)).toBe('slightly_above')
    expect(verdictFromDelta(0.15)).toBe('overpriced')
  })
})

describe('valueScore', () => {
  it('peaks at/under fair value and falls when overpriced', () => {
    expect(valueScore(-0.1)).toBe(100)
    expect(valueScore(0)).toBe(80)
    expect(valueScore(0.1)).toBe(40)
    expect(valueScore(0.2)).toBe(0)
  })
})

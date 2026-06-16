import { describe, expect, it } from 'vitest'
import {
  leaseholdScore,
  linearScore,
  mappedScore,
  thresholdScore,
} from '../../../server/services/scoring/normalize'

describe('linearScore', () => {
  it('scores lower-better (commute) and higher-better (size) via anchor ordering', () => {
    expect(linearScore(15, 15, 75)).toBe(100)
    expect(linearScore(75, 15, 75)).toBe(0)
    expect(linearScore(45, 15, 75)).toBe(50)
    expect(linearScore(1200, 1200, 400)).toBe(100)
    expect(linearScore(800, 1200, 400)).toBe(50)
  })
  it('clamps out-of-range values', () => {
    expect(linearScore(5, 15, 75)).toBe(100)
    expect(linearScore(200, 15, 75)).toBe(0)
  })
})

describe('mappedScore', () => {
  it('looks up case-insensitively, null when absent', () => {
    expect(mappedScore('c', { C: 70 })).toBe(70)
    expect(mappedScore('Z', { C: 70 })).toBeNull()
  })
})

describe('thresholdScore', () => {
  const bands = [
    { upTo: 0, score: 100 },
    { upTo: 2, score: 60 },
  ]
  it('picks the first matching band, else floor', () => {
    expect(thresholdScore(0, bands)).toBe(100)
    expect(thresholdScore(2, bands)).toBe(60)
    expect(thresholdScore(9, bands, 10)).toBe(10)
  })
})

describe('leaseholdScore', () => {
  it('handles freehold, share, and the leasehold cliff', () => {
    expect(leaseholdScore('freehold')).toBe(100)
    expect(leaseholdScore('share_of_freehold')).toBe(85)
    expect(leaseholdScore('leasehold', 125)).toBe(55)
    expect(leaseholdScore('leasehold', 70)).toBe(33) // 55 * 0.6
    expect(leaseholdScore('leasehold', 60)).toBe(17) // 55 * 0.3
    expect(leaseholdScore(null)).toBeNull()
  })
})

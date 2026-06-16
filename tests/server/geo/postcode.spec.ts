import { describe, expect, it } from 'vitest'
import { derivePostcodeParts, normalizePostcode } from '../../../server/services/geo/postcode'

describe('normalizePostcode', () => {
  it('inserts the canonical space', () => {
    expect(normalizePostcode('sw112ab')).toBe('SW11 2AB')
    expect(normalizePostcode('SW11 2AB')).toBe('SW11 2AB')
    expect(normalizePostcode('m1 1aa')).toBe('M1 1AA')
  })
  it('rejects clearly invalid input', () => {
    expect(normalizePostcode('XYZ')).toBeUndefined()
    expect(normalizePostcode('')).toBeUndefined()
    expect(normalizePostcode(null)).toBeUndefined()
  })
})

describe('derivePostcodeParts', () => {
  it('derives district and sector', () => {
    expect(derivePostcodeParts('SW11 2AB')).toEqual({ district: 'SW11', sector: 'SW11 2' })
    expect(derivePostcodeParts('m11aa')).toEqual({ district: 'M1', sector: 'M1 1' })
  })
  it('returns empty for invalid input', () => {
    expect(derivePostcodeParts('nope')).toEqual({})
  })
})

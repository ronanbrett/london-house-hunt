import { describe, expect, it } from 'vitest'
import { parsePastedText } from '../../../server/services/import/parseText'

describe('parsePastedText', () => {
  it('extracts structured fields from a typical listing blurb', () => {
    const text =
      'Guide price £625,000. A 2 bedroom, 1 bathroom leasehold flat with 1 reception. 850 sq ft. ' +
      'Located in SW11 2AB. 90 years remaining on lease.'
    const parsed = parsePastedText(text)
    expect(parsed.price).toBe(625000)
    expect(parsed.beds).toBe(2)
    expect(parsed.baths).toBe(1)
    expect(parsed.receptions).toBe(1)
    expect(parsed.floorAreaSqft).toBe(850)
    expect(parsed.tenure).toBe('leasehold')
    expect(parsed.postcode).toBe('SW11 2AB')
    expect(parsed.leaseYearsRemaining).toBe(90)
  })

  it('converts square metres to sqft when only sqm is given', () => {
    expect(parsePastedText('A home of 100 sqm').floorAreaSqft).toBe(1076)
  })

  it('returns an empty object for empty input', () => {
    expect(parsePastedText('')).toEqual({})
  })

  it('leaves unknown fields undefined', () => {
    const parsed = parsePastedText('A lovely home in a great area')
    expect(parsed.price).toBeUndefined()
    expect(parsed.beds).toBeUndefined()
    expect(parsed.postcode).toBeUndefined()
  })
})

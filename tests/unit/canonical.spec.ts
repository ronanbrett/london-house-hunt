import { describe, expect, it } from 'vitest'
import { CanonicalListingSchema } from '../../shared/types/canonical'

describe('CanonicalListingSchema', () => {
  it('accepts a minimal listing and applies array defaults', () => {
    const parsed = CanonicalListingSchema.parse({ source: 'manual' })
    expect(parsed.source).toBe('manual')
    expect(parsed.photos).toEqual([])
    expect(parsed.floorplans).toEqual([])
    expect(parsed.stations).toEqual([])
  })

  it('rejects an unknown source', () => {
    expect(() => CanonicalListingSchema.parse({ source: 'foo' })).toThrow()
  })

  it('rejects a negative price', () => {
    expect(() => CanonicalListingSchema.parse({ source: 'manual', price: -5 })).toThrow()
  })

  it('keeps a full listing intact', () => {
    const parsed = CanonicalListingSchema.parse({
      source: 'rightmove',
      price: 750000,
      beds: 2,
      tenure: 'leasehold',
      photos: [{ kind: 'photo', url: 'https://example.com/a.jpg' }],
    })
    expect(parsed.price).toBe(750000)
    expect(parsed.photos).toHaveLength(1)
  })
})

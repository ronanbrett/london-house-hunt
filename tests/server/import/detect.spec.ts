import { describe, expect, it } from 'vitest'
import { detectPortal, extractListingId } from '../../../server/services/import/detect'

describe('detectPortal', () => {
  it('detects rightmove', () => {
    expect(detectPortal('https://www.rightmove.co.uk/properties/123456789')).toBe('rightmove')
  })
  it('detects zoopla', () => {
    expect(detectPortal('https://www.zoopla.co.uk/for-sale/details/12345678/')).toBe('zoopla')
  })
  it('returns unknown for other hosts', () => {
    expect(detectPortal('https://www.onthemarket.com/x')).toBe('unknown')
  })
  it('returns unknown for a non-URL', () => {
    expect(detectPortal('not a url')).toBe('unknown')
  })
})

describe('extractListingId', () => {
  it('pulls the rightmove id (with trailing fragment)', () => {
    expect(
      extractListingId('https://www.rightmove.co.uk/properties/123456789#/?channel=RES_BUY', 'rightmove'),
    ).toBe('123456789')
  })
  it('pulls the zoopla id', () => {
    expect(extractListingId('https://www.zoopla.co.uk/for-sale/details/12345678/', 'zoopla')).toBe(
      '12345678',
    )
  })
  it('returns undefined when absent', () => {
    expect(extractListingId('https://www.rightmove.co.uk/property-for-sale', 'rightmove')).toBeUndefined()
  })
})

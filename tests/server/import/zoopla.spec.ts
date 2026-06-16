import { describe, expect, it } from 'vitest'
import { ImportParseError } from '../../../server/services/import/errors'
import { mapZooplaData, parseZooplaHtml } from '../../../server/services/import/zoopla'

const nextData = {
  props: {
    pageProps: {
      listingDetails: {
        listingId: 12345678,
        displayAddress: '2 Sample Road, London SW2 1AA',
        address: { label: '2 Sample Road, London', postcode: 'SW2 1AA' },
        pricing: { value: 500000, qualifier: 'Offers over' },
        propertyType: 'Terraced house',
        tenure: 'Freehold',
        bedrooms: 3,
        bathrooms: 2,
        receptions: 1,
        floorArea: { value: 1200, units: 'sq feet' },
        location: { coordinates: { latitude: 51.45, longitude: -0.12 } },
        detailedDescription: '<p>Spacious family home</p>',
        branch: { name: 'Sample Agents' },
        publishedOn: '2026-02-01T00:00:00Z',
        images: [{ url: 'https://lid.zoocdn.com/1.jpg', caption: 'Front' }],
        floorPlans: [{ url: 'https://lid.zoocdn.com/fp.jpg' }],
      },
    },
  },
}

describe('mapZooplaData', () => {
  const listing = mapZooplaData(nextData, 'https://www.zoopla.co.uk/for-sale/details/12345678/')

  it('finds the listing node and maps core fields', () => {
    expect(listing.source).toBe('zoopla')
    expect(listing.sourceId).toBe('12345678')
    expect(listing.price).toBe(500000)
    expect(listing.priceQualifier).toBe('Offers over')
    expect(listing.beds).toBe(3)
    expect(listing.baths).toBe(2)
    expect(listing.receptions).toBe(1)
    expect(listing.tenure).toBe('freehold')
    expect(listing.propertyType).toBe('Terraced house')
    expect(listing.postcode).toBe('SW2 1AA')
    expect(listing.lat).toBe(51.45)
    expect(listing.lng).toBe(-0.12)
    expect(listing.floorAreaSqft).toBe(1200)
    expect(listing.agentName).toBe('Sample Agents')
    expect(listing.photos).toHaveLength(1)
    expect(listing.floorplans).toHaveLength(1)
  })
})

describe('parseZooplaHtml', () => {
  it('extracts __NEXT_DATA__ from page HTML', () => {
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></body></html>`
    const listing = parseZooplaHtml(html)
    expect(listing.sourceId).toBe('12345678')
    expect(listing.price).toBe(500000)
  })

  it('throws ImportParseError when __NEXT_DATA__ is missing', () => {
    expect(() => parseZooplaHtml('<html><body>nope</body></html>')).toThrow(ImportParseError)
  })
})

import { describe, expect, it } from 'vitest'
import { ImportParseError } from '../../../server/services/import/errors'
import { mapZooplaData, mapZooplaTargeting, parseZooplaHtml } from '../../../server/services/import/zoopla'

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

const targeting = {
  __typename: 'ListingAnalyticsTaxonomy',
  listing_id: '66118284',
  display_address: '75 Victoria Street, Victoria, Victoria SW1H',
  outcode: 'SW1H',
  incode: '0HY',
  price_actual: '6000',
  price: '6000',
  price_qualifier: '',
  property_type: 'flat',
  tenure: '',
  num_beds: '3',
  num_baths: '3',
  num_recepts: '2',
  size_sq_feet: '',
  branch_name: 'Jeffersons Estate Agents Limited',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: '3 bed flat to rent 75 Victoria Street, Victoria, Victoria SW1H',
  description: 'This beautiful flat has three very spacious double bedrooms.',
  datePosted: '2026-05-19T12:20:35',
  image: 'https://lid.zoocdn.com/u/480/360/abc123.jpg',
  offers: { price: 6000, priceCurrency: 'GBP' },
}

describe('mapZooplaData (legacy __NEXT_DATA__ format)', () => {
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

describe('mapZooplaTargeting (__ZAD_TARGETING__ + JSON-LD format)', () => {
  const listing = mapZooplaTargeting(
    targeting,
    jsonLd,
    'https://www.zoopla.co.uk/to-rent/details/66118284/',
  )

  it('maps core fields from targeting data', () => {
    expect(listing.source).toBe('zoopla')
    expect(listing.sourceId).toBe('66118284')
    expect(listing.displayAddress).toBe('75 Victoria Street, Victoria, Victoria SW1H')
    expect(listing.postcode).toBe('SW1H 0HY')
    expect(listing.price).toBe(6000)
    expect(listing.propertyType).toBe('flat')
    expect(listing.beds).toBe(3)
    expect(listing.baths).toBe(3)
    expect(listing.receptions).toBe(2)
    expect(listing.agentName).toBe('Jeffersons Estate Agents Limited')
  })

  it('supplements with JSON-LD data', () => {
    expect(listing.description).toBe(
      'This beautiful flat has three very spacious double bedrooms.',
    )
    expect(listing.firstListedAt).toBe(Date.parse('2026-05-19T12:20:35'))
    expect(listing.photos).toHaveLength(1)
    expect(listing.photos[0].url).toBe('https://lid.zoocdn.com/u/480/360/abc123.jpg')
  })

  it('works with targeting only (no JSON-LD)', () => {
    const listing = mapZooplaTargeting(targeting, null, 'https://www.zoopla.co.uk/to-rent/details/66118284/')
    expect(listing.sourceId).toBe('66118284')
    expect(listing.price).toBe(6000)
    expect(listing.description).toBeUndefined()
    expect(listing.photos).toHaveLength(0)
  })

  it('handles empty size_sq_feet gracefully', () => {
    expect(listing.floorAreaSqft).toBeUndefined()
  })
})

describe('parseZooplaHtml', () => {
  it('extracts __NEXT_DATA__ from page HTML when present', () => {
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></body></html>`
    const listing = parseZooplaHtml(html)
    expect(listing.sourceId).toBe('12345678')
    expect(listing.price).toBe(500000)
  })

  it('falls back to __ZAD_TARGETING__ + JSON-LD when __NEXT_DATA__ is missing', () => {
    const html = `<html><body>
      <script id="__ZAD_TARGETING__" type="application/json">${JSON.stringify(targeting)}</script>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </body></html>`
    const listing = parseZooplaHtml(html, 'https://www.zoopla.co.uk/to-rent/details/66118284/')
    expect(listing.sourceId).toBe('66118284')
    expect(listing.price).toBe(6000)
    expect(listing.beds).toBe(3)
    expect(listing.description).toBe(
      'This beautiful flat has three very spacious double bedrooms.',
    )
  })

  it('throws ImportParseError when no data source is found', () => {
    expect(() => parseZooplaHtml('<html><body>nope</body></html>')).toThrow(ImportParseError)
  })
})

import { describe, expect, it } from 'vitest'
import { ImportParseError } from '../../../server/services/import/errors'
import { mapRightmoveModel, parseRightmoveHtml } from '../../../server/services/import/rightmove'

const model = {
  propertyData: {
    id: 123456789,
    bedrooms: 2,
    bathrooms: 1,
    address: { displayAddress: '1 Test Street, London', outcode: 'SW11', incode: '2AB' },
    prices: { primaryPrice: '£750,000', displayPriceQualifier: 'Guide Price' },
    propertySubType: 'Flat',
    tenure: { tenureType: 'LEASEHOLD', yearsRemainingOnLease: 95 },
    livingCosts: { councilTaxBand: 'D', annualServiceCharge: 1800, annualGroundRent: 250 },
    sizings: [
      { unit: 'sqft', minimumSize: 700, maximumSize: 750 },
      { unit: 'sqm', minimumSize: 65, maximumSize: 70 },
    ],
    location: { latitude: 51.46, longitude: -0.16 },
    nearestStations: [{ name: 'Clapham Junction', types: ['NATIONAL_TRAIN'], distance: 0.3 }],
    images: [{ url: 'https://media.rightmove.co.uk/1.jpg', caption: 'Living room' }],
    floorplans: [{ url: 'https://media.rightmove.co.uk/fp1.gif', caption: 'Floorplan' }],
    customer: { branchDisplayName: 'Test Estates, London' },
    text: { description: '<p>A <b>lovely</b> flat.</p>' },
    firstVisibleDate: '2026-01-15T00:00:00Z',
  },
}

describe('mapRightmoveModel', () => {
  const listing = mapRightmoveModel(model, 'https://www.rightmove.co.uk/properties/123456789')

  it('maps the core fields', () => {
    expect(listing.source).toBe('rightmove')
    expect(listing.sourceId).toBe('123456789')
    expect(listing.price).toBe(750000)
    expect(listing.priceQualifier).toBe('Guide Price')
    expect(listing.beds).toBe(2)
    expect(listing.baths).toBe(1)
    expect(listing.propertyType).toBe('Flat')
    expect(listing.postcode).toBe('SW11 2AB')
    expect(listing.lat).toBe(51.46)
    expect(listing.lng).toBe(-0.16)
  })

  it('maps tenure + leasehold costs', () => {
    expect(listing.tenure).toBe('leasehold')
    expect(listing.leaseYearsRemaining).toBe(95)
    expect(listing.serviceChargeAnnual).toBe(1800)
    expect(listing.groundRentAnnual).toBe(250)
    expect(listing.councilTaxBand).toBe('D')
  })

  it('prefers sqft from sizings and strips HTML from the description', () => {
    expect(listing.floorAreaSqft).toBe(750)
    expect(listing.description).toBe('A lovely flat.')
  })

  it('maps media + stations + agent + listed date', () => {
    expect(listing.photos).toHaveLength(1)
    expect(listing.floorplans).toHaveLength(1)
    expect(listing.stations[0]).toMatchObject({ name: 'Clapham Junction', distanceMiles: 0.3 })
    expect(listing.agentName).toBe('Test Estates, London')
    expect(listing.firstListedAt).toBe(Date.parse('2026-01-15T00:00:00Z'))
  })
})

describe('parseRightmoveHtml', () => {
  it('extracts PAGE_MODEL from page HTML', () => {
    const html = `<html><head><script>window.PAGE_MODEL = ${JSON.stringify(model)};</script></head><body></body></html>`
    const listing = parseRightmoveHtml(html)
    expect(listing.sourceId).toBe('123456789')
    expect(listing.price).toBe(750000)
  })

  it('throws ImportParseError when PAGE_MODEL is missing', () => {
    expect(() => parseRightmoveHtml('<html><body>nope</body></html>')).toThrow(ImportParseError)
  })
})

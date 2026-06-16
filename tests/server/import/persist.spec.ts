import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { CanonicalListingSchema } from '../../../shared/types/canonical'
import { nearestStations, properties, propertyMedia } from '../../../server/db/schema'
import { persistListing } from '../../../server/services/import/persist'
import { makeTestDb } from '../../helpers/testDb'

function listing(overrides: Record<string, unknown> = {}) {
  return CanonicalListingSchema.parse({
    source: 'manual',
    displayAddress: '1 Test St, London',
    postcode: 'SW11 2AB',
    lat: 51.46, // provided so persist does no network lookup
    lng: -0.16,
    price: 500000,
    beds: 2,
    baths: 1,
    photos: [{ kind: 'photo', url: 'https://x/1.jpg' }],
    floorplans: [{ kind: 'floorplan', url: 'https://x/fp.jpg' }],
    stations: [{ name: 'Clapham Junction', distanceMiles: 0.3 }],
    ...overrides,
  })
}

describe('persistListing', () => {
  it('inserts a property with derived sector/district plus media and stations', async () => {
    const db = await makeTestDb()
    const id = await persistListing(listing(), db)

    const [row] = await db.select().from(properties).where(eq(properties.id, id))
    expect(row.postcodeDistrict).toBe('SW11')
    expect(row.postcodeSector).toBe('SW11 2')
    expect(row.price).toBe(500000)

    const media = await db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, id))
    expect(media).toHaveLength(2)
    const stations = await db.select().from(nearestStations).where(eq(nearestStations.propertyId, id))
    expect(stations).toHaveLength(1)
  })

  it('re-importing the same sourceUrl updates in place (no duplicate)', async () => {
    const db = await makeTestDb()
    const url = 'https://www.rightmove.co.uk/properties/1'
    const first = await persistListing(listing({ source: 'rightmove', sourceUrl: url, price: 500000 }), db)
    const second = await persistListing(listing({ source: 'rightmove', sourceUrl: url, price: 525000 }), db)

    expect(second).toBe(first)
    const all = await db.select().from(properties)
    expect(all).toHaveLength(1)
    expect(all[0].price).toBe(525000)
  })
})

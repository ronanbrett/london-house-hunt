import type { CanonicalListing } from '#shared/types/canonical'
import { eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { nearestStations, properties, propertyMedia } from '../../db/schema'
import { derivePostcodeParts, lookupPostcode } from '../geo/postcode'

/**
 * Persist a CanonicalListing (from any import path) into the DB, deriving postcode
 * sector/district and backfilling lat/lng from postcodes.io when the listing lacks them.
 * Re-importing the same `sourceUrl` updates the existing row (and replaces its media/stations).
 * Returns the property id.
 */
export async function persistListing(
  listing: CanonicalListing,
  db: AppDatabase = useDb(),
): Promise<string> {
  const parts = derivePostcodeParts(listing.postcode)

  let lat = listing.lat
  let lng = listing.lng
  if ((lat == null || lng == null) && listing.postcode) {
    const geo = await lookupPostcode(listing.postcode)
    if (geo) {
      if (lat == null) lat = geo.lat
      if (lng == null) lng = geo.lng
    }
  }

  const row = {
    source: listing.source,
    sourceUrl: listing.sourceUrl ?? null,
    sourceId: listing.sourceId ?? null,
    rawPayload: listing,
    displayAddress: listing.displayAddress ?? null,
    postcode: listing.postcode ?? null,
    postcodeSector: parts.sector ?? null,
    postcodeDistrict: parts.district ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
    price: listing.price ?? null,
    priceQualifier: listing.priceQualifier ?? null,
    propertyType: listing.propertyType ?? null,
    tenure: listing.tenure ?? null,
    leaseYearsRemaining: listing.leaseYearsRemaining ?? null,
    serviceChargeAnnual: listing.serviceChargeAnnual ?? null,
    groundRentAnnual: listing.groundRentAnnual ?? null,
    beds: listing.beds ?? null,
    baths: listing.baths ?? null,
    receptions: listing.receptions ?? null,
    floorAreaSqft: listing.floorAreaSqft ?? null,
    epcCurrent: listing.epcCurrent ?? null,
    epcPotential: listing.epcPotential ?? null,
    councilTaxBand: listing.councilTaxBand ?? null,
    description: listing.description ?? null,
    agentName: listing.agentName ?? null,
    firstListedAt: listing.firstListedAt ?? null,
    updatedAt: Date.now(),
  }

  // Re-import of a known URL updates in place; manual entries always insert.
  const existing = listing.sourceUrl
    ? await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.sourceUrl, listing.sourceUrl))
        .limit(1)
    : []

  let id: string
  const existingId = existing[0]?.id
  if (existingId) {
    id = existingId
    await db.update(properties).set(row).where(eq(properties.id, id))
    await db.delete(propertyMedia).where(eq(propertyMedia.propertyId, id))
    await db.delete(nearestStations).where(eq(nearestStations.propertyId, id))
  } else {
    const inserted = await db.insert(properties).values(row).returning({ id: properties.id })
    const newId = inserted[0]?.id
    if (!newId) throw new Error('Insert did not return a property id')
    id = newId
  }

  const media = [
    ...listing.photos.map((p, i) => ({
      propertyId: id,
      kind: 'photo' as const,
      url: p.url,
      caption: p.caption ?? null,
      sortOrder: i,
    })),
    ...listing.floorplans.map((p, i) => ({
      propertyId: id,
      kind: 'floorplan' as const,
      url: p.url,
      caption: p.caption ?? null,
      sortOrder: i,
    })),
  ]
  if (media.length) await db.insert(propertyMedia).values(media)

  const stations = listing.stations.map((s) => ({
    propertyId: id,
    name: s.name,
    type: s.type ?? null,
    distanceMiles: s.distanceMiles ?? null,
  }))
  if (stations.length) await db.insert(nearestStations).values(stations)

  return id
}

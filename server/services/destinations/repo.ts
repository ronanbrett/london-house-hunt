import { desc, eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { destinations } from '../../db/schema'
import { lookupPostcode } from '../geo/postcode'

export type DestinationRow = typeof destinations.$inferSelect
export type TravelMode = DestinationRow['mode']

export async function listDestinations(db: AppDatabase = useDb()): Promise<DestinationRow[]> {
  return db.select().from(destinations).orderBy(desc(destinations.importance))
}

export interface NewDestination {
  label: string
  postcode?: string
  lat?: number
  lng?: number
  mode?: TravelMode
  importance?: number
}

/** Create a destination, geocoding the postcode to lat/lng when coordinates aren't supplied. */
export async function createDestination(input: NewDestination, db: AppDatabase = useDb()) {
  let lat = input.lat
  let lng = input.lng
  if ((lat == null || lng == null) && input.postcode) {
    const geo = await lookupPostcode(input.postcode)
    if (geo) {
      lat = geo.lat
      lng = geo.lng
    }
  }
  const [row] = await db
    .insert(destinations)
    .values({
      label: input.label,
      lat: lat ?? null,
      lng: lng ?? null,
      mode: input.mode ?? 'transit',
      importance: input.importance ?? 3,
    })
    .returning()
  if (!row) throw new Error('Insert did not return a destination')
  return row
}

export async function deleteDestination(id: string, db: AppDatabase = useDb()): Promise<boolean> {
  const res = await db.delete(destinations).where(eq(destinations.id, id)).returning({ id: destinations.id })
  return res.length > 0
}

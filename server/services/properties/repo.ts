import { and, desc, eq, inArray } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { nearestStations, notes, properties, propertyMedia } from '../../db/schema'

export type PropertyRow = typeof properties.$inferSelect

/** List saved properties (newest first) with a thumbnail (first photo). */
export async function listProperties(db: AppDatabase = useDb()) {
  const rows = await db.select().from(properties).orderBy(desc(properties.createdAt))
  if (!rows.length) return []

  const ids = rows.map((r) => r.id)
  const photos = await db
    .select()
    .from(propertyMedia)
    .where(and(inArray(propertyMedia.propertyId, ids), eq(propertyMedia.kind, 'photo')))
    .orderBy(propertyMedia.sortOrder)

  const thumb = new Map<string, string>()
  for (const p of photos) if (!thumb.has(p.propertyId)) thumb.set(p.propertyId, p.url)

  return rows.map((r) => ({ ...r, thumbnail: thumb.get(r.id) ?? null }))
}

/** Full property bundle for the detail page, or null if not found. */
export async function getProperty(id: string, db: AppDatabase = useDb()) {
  const [property] = await db.select().from(properties).where(eq(properties.id, id)).limit(1)
  if (!property) return null

  const media = await db
    .select()
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, id))
    .orderBy(propertyMedia.sortOrder)
  const stations = await db.select().from(nearestStations).where(eq(nearestStations.propertyId, id))
  const propertyNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.propertyId, id))
    .orderBy(desc(notes.createdAt))

  return {
    property,
    photos: media.filter((m) => m.kind === 'photo'),
    floorplans: media.filter((m) => m.kind === 'floorplan'),
    stations,
    notes: propertyNotes,
  }
}

export async function deleteProperty(id: string, db: AppDatabase = useDb()): Promise<boolean> {
  const res = await db.delete(properties).where(eq(properties.id, id)).returning({ id: properties.id })
  return res.length > 0
}

export async function addNote(id: string, body: string, db: AppDatabase = useDb()) {
  const [note] = await db.insert(notes).values({ propertyId: id, body }).returning()
  return note
}

export async function updateStatus(
  id: string,
  status: PropertyRow['status'],
  db: AppDatabase = useDb(),
): Promise<boolean> {
  const res = await db
    .update(properties)
    .set({ status, updatedAt: Date.now() })
    .where(eq(properties.id, id))
    .returning({ id: properties.id })
  return res.length > 0
}

export type FactFields = Pick<
  PropertyRow,
  | 'price'
  | 'priceQualifier'
  | 'beds'
  | 'baths'
  | 'receptions'
  | 'floorAreaSqft'
  | 'propertyType'
  | 'tenure'
  | 'leaseYearsRemaining'
  | 'serviceChargeAnnual'
  | 'groundRentAnnual'
  | 'councilTaxBand'
  | 'epcCurrent'
>

export async function updateFacts(
  id: string,
  fields: Partial<FactFields>,
  db: AppDatabase = useDb(),
): Promise<boolean> {
  const res = await db
    .update(properties)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(properties.id, id))
    .returning({ id: properties.id })
  return res.length > 0
}

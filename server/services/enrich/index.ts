import { desc, eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { type SnapshotStatus, getOrFetch } from '../../cache/snapshot'
import { enrichmentSnapshots, properties } from '../../db/schema'
import { floodEnricher } from './flood'
import { policeEnricher } from './police'
import type { EnrichContext, Enricher } from './types'

// Registry — add new enrichers here. Keyless sources first; key-gated ones skip when unconfigured.
export const ENRICHERS: Enricher[] = [policeEnricher, floodEnricher]

export type EnrichStatusMap = Record<string, SnapshotStatus | 'skipped'>

/** Run every enricher for a property (through the cache), returning a per-source status map. */
export async function enrichProperty(
  propertyId: string,
  opts: { db?: AppDatabase; force?: boolean } = {},
): Promise<EnrichStatusMap> {
  const db = opts.db ?? useDb()
  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  if (!prop) throw new Error('Property not found')

  const ctx: EnrichContext = {
    propertyId,
    postcode: prop.postcode,
    lat: prop.lat,
    lng: prop.lng,
  }

  const result: EnrichStatusMap = {}
  await Promise.all(
    ENRICHERS.map(async (e) => {
      const cacheKey = e.cacheKey(ctx)
      if (cacheKey == null) {
        result[e.source] = 'skipped'
        return
      }
      const outcome = await getOrFetch({
        propertyId,
        source: e.source,
        cacheKey,
        ttlDays: e.ttlDays,
        fetcher: () => e.fetch(ctx),
        db,
        force: opts.force,
      })
      result[e.source] = outcome.status
    }),
  )
  return result
}

export interface EnrichmentEntry {
  status: string
  derived: unknown
  fetchedAt: number
  matchConfidence: number | null
}

/** Latest snapshot per source for a property (for rendering the detail-page panels). */
export async function getLatestEnrichment(
  propertyId: string,
  db: AppDatabase = useDb(),
): Promise<Record<string, EnrichmentEntry>> {
  const rows = await db
    .select()
    .from(enrichmentSnapshots)
    .where(eq(enrichmentSnapshots.propertyId, propertyId))
    .orderBy(desc(enrichmentSnapshots.fetchedAt))

  const latest: Record<string, EnrichmentEntry> = {}
  for (const r of rows) {
    if (!latest[r.source]) {
      latest[r.source] = {
        status: r.status,
        derived: r.derivedJson,
        fetchedAt: r.fetchedAt,
        matchConfidence: r.matchConfidence,
      }
    }
  }
  return latest
}

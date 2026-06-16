import type { EnrichmentSource } from '#shared/types/canonical'
import { and, desc, eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../db/client'
import { enrichmentSnapshots } from '../db/schema'

/** What an enricher's fetch returns to the cache. */
export type FetcherResult<T> =
  | { status: 'ok'; raw?: unknown; derived: T; matchConfidence?: number }
  | { status: 'no_match'; raw?: unknown }

export type SnapshotStatus = 'fresh' | 'cached' | 'stale-error' | 'error' | 'no_match'

export interface SnapshotOutcome<T> {
  status: SnapshotStatus
  derived?: T
  fetchedAt?: number
  matchConfidence?: number | null
}

const DAY_MS = 86_400_000

/**
 * DB-backed, append-only get-or-fetch. Returns the freshest in-TTL snapshot if present (matching
 * cacheKey); otherwise runs `fetcher`, stores a new snapshot, and returns it. On fetch error,
 * falls back to the most recent good snapshot (`stale-error`) or records an `error` snapshot.
 * Never throws for transport failures — failures are surfaced as statuses so one dead source
 * can't block the others.
 */
export async function getOrFetch<T>(opts: {
  propertyId: string
  source: EnrichmentSource
  cacheKey: string
  ttlDays: number
  fetcher: () => Promise<FetcherResult<T>>
  db?: AppDatabase
  force?: boolean
}): Promise<SnapshotOutcome<T>> {
  const db = opts.db ?? useDb()

  const [newest] = await db
    .select()
    .from(enrichmentSnapshots)
    .where(
      and(
        eq(enrichmentSnapshots.propertyId, opts.propertyId),
        eq(enrichmentSnapshots.source, opts.source),
      ),
    )
    .orderBy(desc(enrichmentSnapshots.fetchedAt))
    .limit(1)

  const isFresh =
    newest &&
    newest.cacheKey === opts.cacheKey &&
    (newest.status === 'ok' || newest.status === 'no_match') &&
    newest.fetchedAt > Date.now() - opts.ttlDays * DAY_MS

  if (isFresh && !opts.force) {
    return {
      status: newest.status === 'no_match' ? 'no_match' : 'cached',
      derived: (newest.derivedJson as T) ?? undefined,
      fetchedAt: newest.fetchedAt,
      matchConfidence: newest.matchConfidence,
    }
  }

  try {
    const result = await opts.fetcher()
    await db.insert(enrichmentSnapshots).values({
      propertyId: opts.propertyId,
      source: opts.source,
      cacheKey: opts.cacheKey,
      status: result.status,
      matchConfidence: result.status === 'ok' ? (result.matchConfidence ?? null) : null,
      rawJson: result.raw ?? null,
      derivedJson: result.status === 'ok' ? result.derived : null,
      ttlDays: opts.ttlDays,
    })
    if (result.status === 'no_match') return { status: 'no_match' }
    return {
      status: 'fresh',
      derived: result.derived,
      fetchedAt: Date.now(),
      matchConfidence: result.matchConfidence ?? null,
    }
  } catch {
    const [lastGood] = await db
      .select()
      .from(enrichmentSnapshots)
      .where(
        and(
          eq(enrichmentSnapshots.propertyId, opts.propertyId),
          eq(enrichmentSnapshots.source, opts.source),
          eq(enrichmentSnapshots.status, 'ok'),
        ),
      )
      .orderBy(desc(enrichmentSnapshots.fetchedAt))
      .limit(1)

    if (lastGood) {
      return {
        status: 'stale-error',
        derived: (lastGood.derivedJson as T) ?? undefined,
        fetchedAt: lastGood.fetchedAt,
        matchConfidence: lastGood.matchConfidence,
      }
    }
    await db.insert(enrichmentSnapshots).values({
      propertyId: opts.propertyId,
      source: opts.source,
      cacheKey: opts.cacheKey,
      status: 'error',
      ttlDays: opts.ttlDays,
    })
    return { status: 'error' }
  }
}

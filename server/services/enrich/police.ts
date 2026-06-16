import { TTL_DAYS } from '../../cache/ttl'
import { fetchJson } from './http'
import { type Enricher, geoKey } from './types'

export interface CrimeDerived {
  month: string | null
  total: number
  byCategory: { category: string; count: number }[]
}

interface PoliceCrime {
  category: string
  month: string
}

/** Aggregate street-level crimes into a month + total + per-category breakdown (desc). */
export function deriveCrime(crimes: PoliceCrime[]): CrimeDerived {
  const counts = new Map<string, number>()
  let month: string | null = null
  for (const c of crimes) {
    if (c.category) counts.set(c.category, (counts.get(c.category) ?? 0) + 1)
    if (c.month) month = c.month
  }
  const byCategory = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
  return { month, total: crimes.length, byCategory }
}

// police.uk — free, no key, ~1-mile radius, latest available month.
export const policeEnricher: Enricher<CrimeDerived> = {
  source: 'police',
  label: 'Crime',
  ttlDays: TTL_DAYS.police,
  cacheKey: geoKey,
  async fetch(ctx) {
    const crimes = await fetchJson<PoliceCrime[]>(
      `https://data.police.uk/api/crimes-street/all-crime?lat=${ctx.lat}&lng=${ctx.lng}`,
    )
    if (!Array.isArray(crimes)) return { status: 'no_match' }
    return { status: 'ok', derived: deriveCrime(crimes), matchConfidence: 1 }
  },
}

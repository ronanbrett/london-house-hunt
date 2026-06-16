import { TTL_DAYS } from '../../cache/ttl'
import { fetchJson } from './http'
import { type Enricher, geoKey } from './types'

export interface FloodDerived {
  areaCount: number
  areas: { description: string; riverOrSea: string | null }[]
}

interface FloodAreaItem {
  description?: string
  label?: string
  riverOrSea?: string
}

/** Summarise nearby Environment Agency flood areas (designated river/sea flood zones). */
export function deriveFlood(items: FloodAreaItem[]): FloodDerived {
  const areas = items.slice(0, 10).map((i) => ({
    description: i.description ?? i.label ?? 'Flood area',
    riverOrSea: i.riverOrSea ?? null,
  }))
  return { areaCount: items.length, areas }
}

// Environment Agency flood-monitoring — free, no key. Flood areas within 2km of the point.
export const floodEnricher: Enricher<FloodDerived> = {
  source: 'flood',
  label: 'Flood risk',
  ttlDays: TTL_DAYS.flood,
  cacheKey: geoKey,
  async fetch(ctx) {
    const res = await fetchJson<{ items?: FloodAreaItem[] }>(
      `https://environment.data.gov.uk/flood-monitoring/id/floodAreas?lat=${ctx.lat}&long=${ctx.lng}&dist=2`,
    )
    const items = Array.isArray(res?.items) ? res.items : []
    return { status: 'ok', derived: deriveFlood(items), matchConfidence: 1 }
  },
}

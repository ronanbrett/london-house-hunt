import type { EnrichmentSource } from '#shared/types/canonical'
import type { FetcherResult } from '../../cache/snapshot'

/** Inputs available to every enricher for a given property. */
export interface EnrichContext {
  propertyId: string
  postcode?: string | null
  lat?: number | null
  lng?: number | null
}

export interface Enricher<T = unknown> {
  source: EnrichmentSource
  label: string
  ttlDays: number
  /** Stable key for this property's inputs; `null` => insufficient data, skip this source. */
  cacheKey: (ctx: EnrichContext) => string | null
  fetch: (ctx: EnrichContext) => Promise<FetcherResult<T>>
}

/** Round lat/lng to ~100m so nearby re-imports share a cache entry. */
export function geoKey(ctx: EnrichContext): string | null {
  if (ctx.lat == null || ctx.lng == null) return null
  return `${ctx.lat.toFixed(3)},${ctx.lng.toFixed(3)}`
}

import { TTL_DAYS } from '../../cache/ttl'
import { fetchJson } from './http'
import { type DestinationInput, type Enricher, geoKey } from './types'

export interface CommuteLeg {
  destinationId: string
  label: string
  minutes: number | null
  mode: string
}
export interface CommuteDerived {
  destinations: CommuteLeg[]
  blendedMinutes: number | null
}

/** Importance-weighted average of the per-destination commute minutes (ignores unknowns). */
export function blendCommute(legs: { minutes: number | null; importance: number }[]): number | null {
  const valid = legs.filter((l): l is { minutes: number; importance: number } => l.minutes != null && l.importance > 0)
  if (!valid.length) return null
  const totalWeight = valid.reduce((s, l) => s + l.importance, 0)
  return Math.round(valid.reduce((s, l) => s + l.minutes * l.importance, 0) / totalWeight)
}

function tflMode(mode: string): string | null {
  if (mode === 'walking') return 'walking'
  if (mode === 'cycling') return 'cycling'
  return null // transit/driving → default public-transport planner
}

async function journeyMinutes(
  fromLat: number,
  fromLng: number,
  dest: DestinationInput,
): Promise<number | null> {
  const params = new URLSearchParams()
  const mode = tflMode(dest.mode)
  if (mode) params.set('mode', mode)
  const appKey = process.env.NUXT_TFL_APP_KEY
  if (appKey) params.set('app_key', appKey)
  const qs = params.toString() ? `?${params}` : ''
  const url = `https://api.tfl.gov.uk/Journey/JourneyResults/${fromLat},${fromLng}/to/${dest.lat},${dest.lng}${qs}`
  try {
    const res = await fetchJson<{ journeys?: { duration?: number }[] }>(url)
    const durations = (res?.journeys ?? [])
      .map((j) => j.duration)
      .filter((d): d is number => typeof d === 'number')
    return durations.length ? Math.min(...durations) : null
  } catch {
    return null // one unreachable destination shouldn't fail the whole enricher
  }
}

// TfL journey planner — works anonymously; NUXT_TFL_APP_KEY just raises limits.
export const commuteEnricher: Enricher<CommuteDerived> = {
  source: 'tfl',
  label: 'Commute',
  ttlDays: TTL_DAYS.tfl,
  cacheKey: (ctx) => {
    if (ctx.lat == null || ctx.lng == null) return null
    const dests = (ctx.destinations ?? []).filter((d) => d.lat != null && d.lng != null)
    if (!dests.length) return null
    return `${geoKey(ctx)}|${dests.map((d) => `${d.id}:${d.lat},${d.lng}:${d.mode}`).join('|')}`
  },
  async fetch(ctx) {
    const dests = (ctx.destinations ?? []).filter(
      (d): d is DestinationInput & { lat: number; lng: number } => d.lat != null && d.lng != null,
    )
    const legs: CommuteLeg[] = []
    const weighted: { minutes: number | null; importance: number }[] = []
    for (const d of dests) {
      const minutes = await journeyMinutes(ctx.lat as number, ctx.lng as number, d)
      legs.push({ destinationId: d.id, label: d.label, minutes, mode: d.mode })
      weighted.push({ minutes, importance: d.importance })
    }
    return {
      status: 'ok',
      derived: { destinations: legs, blendedMinutes: blendCommute(weighted) },
      matchConfidence: 1,
    }
  },
}

import { TTL_DAYS } from '../../cache/ttl'
import { fetchJson } from './http'
import { type Enricher, geoKey } from './types'

export interface StationsDerived {
  stations: { name: string; modes: string[]; distanceMiles: number }[]
}

interface TflStopPoint {
  commonName?: string
  distance?: number // metres from the query point
  modes?: string[]
}

const RELEVANT_MODES = new Set([
  'tube',
  'overground',
  'dlr',
  'elizabeth-line',
  'national-rail',
  'tram',
])

function cleanName(name: string): string {
  return name.replace(/\s+(Underground|Rail|DLR)\s+Station$/i, '').trim()
}

/** Nearest stations (de-duplicated by name), closest first, max 8. */
export function deriveStations(stopPoints: TflStopPoint[]): StationsDerived {
  const mapped = stopPoints
    .filter((s) => typeof s.commonName === 'string' && typeof s.distance === 'number')
    .map((s) => ({
      name: cleanName(s.commonName as string),
      modes: (s.modes ?? []).filter((m) => RELEVANT_MODES.has(m)),
      distanceMiles: Math.round(((s.distance as number) / 1609.34) * 100) / 100,
    }))
    .filter((s) => s.modes.length > 0)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)

  const seen = new Set<string>()
  const stations: StationsDerived['stations'] = []
  for (const s of mapped) {
    if (seen.has(s.name)) continue
    seen.add(s.name)
    stations.push(s)
    if (stations.length >= 8) break
  }
  return { stations }
}

// TfL StopPoint geo search — works anonymously; an app key (NUXT_TFL_APP_KEY) just raises limits.
export const stationsEnricher: Enricher<StationsDerived> = {
  source: 'transit',
  label: 'Stations',
  ttlDays: TTL_DAYS.transit,
  cacheKey: geoKey,
  async fetch(ctx) {
    const appKey = process.env.NUXT_TFL_APP_KEY
    const keyParam = appKey ? `&app_key=${encodeURIComponent(appKey)}` : ''
    const res = await fetchJson<{ stopPoints?: TflStopPoint[] }>(
      `https://api.tfl.gov.uk/StopPoint?lat=${ctx.lat}&lon=${ctx.lng}&stopTypes=NaptanMetroStation,NaptanRailStation&radius=1500${keyParam}`,
    )
    const stopPoints = Array.isArray(res?.stopPoints) ? res.stopPoints : []
    return { status: 'ok', derived: deriveStations(stopPoints), matchConfidence: 1 }
  },
}

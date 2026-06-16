import { describe, expect, it } from 'vitest'
import { deriveStations } from '../../../server/services/enrich/stations'

const stops = [
  { commonName: 'Clapham Junction Rail Station', distance: 482, modes: ['national-rail', 'overground'] },
  { commonName: 'Clapham Common Underground Station', distance: 1200, modes: ['tube'] },
  { commonName: 'A Bus Stop', distance: 50, modes: ['bus'] }, // dropped — no rail mode
  { commonName: 'Clapham Junction Rail Station', distance: 490, modes: ['national-rail'] }, // dup name
]

describe('deriveStations', () => {
  it('cleans names, drops non-rail modes, de-dupes and sorts by distance', () => {
    const d = deriveStations(stops as never)
    expect(d.stations.map((s) => s.name)).toEqual(['Clapham Junction', 'Clapham Common'])
    expect(d.stations[0]!.modes).toContain('national-rail')
    expect(d.stations[0]!.distanceMiles).toBeCloseTo(0.3, 1)
  })
  it('handles no stops', () => {
    expect(deriveStations([])).toEqual({ stations: [] })
  })
})

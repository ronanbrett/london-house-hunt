import { describe, expect, it } from 'vitest'
import { deriveFlood } from '../../../server/services/enrich/flood'
import { deriveCrime } from '../../../server/services/enrich/police'

describe('deriveCrime', () => {
  it('totals and ranks categories', () => {
    const d = deriveCrime([
      { category: 'burglary', month: '2026-01' },
      { category: 'burglary', month: '2026-01' },
      { category: 'violent-crime', month: '2026-01' },
    ])
    expect(d.total).toBe(3)
    expect(d.month).toBe('2026-01')
    expect(d.byCategory).toEqual([
      { category: 'burglary', count: 2 },
      { category: 'violent-crime', count: 1 },
    ])
  })
  it('handles no crimes', () => {
    expect(deriveCrime([])).toEqual({ month: null, total: 0, byCategory: [] })
  })
})

describe('deriveFlood', () => {
  it('summarises flood areas', () => {
    expect(deriveFlood([{ description: 'Thames', riverOrSea: 'River Thames' }])).toEqual({
      areaCount: 1,
      areas: [{ description: 'Thames', riverOrSea: 'River Thames' }],
    })
  })
  it('handles no flood areas', () => {
    expect(deriveFlood([])).toEqual({ areaCount: 0, areas: [] })
  })
})

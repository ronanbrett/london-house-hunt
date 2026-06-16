import { describe, expect, it } from 'vitest'
import type { MetricInput } from '../../../server/services/scoring/metrics'
import { scoreProperty } from '../../../server/services/scoring/score'

describe('scoreProperty', () => {
  it('scores a fully-populated property with full confidence', () => {
    const input: MetricInput = {
      valueDeltaPct: 0,
      commuteMinutes: 30,
      nearestStationMiles: 0.3,
      crimeTotal: 100,
      floodAreaCount: 0,
      epcCurrent: 'C',
      tenure: 'freehold',
      floorAreaSqft: 800,
    }
    const s = scoreProperty(input)
    expect(s.confidence).toBe(1)
    expect(s.contributions).toHaveLength(8)
    expect(s.contributions.every((c) => !c.missing)).toBe(true)
    expect(s.total).toBeGreaterThan(0)
    expect(s.total).toBeLessThanOrEqual(100)
  })

  it('excludes missing metrics (renormalising) and lowers confidence', () => {
    // Only tenure present; EPC missing falls to neutral 50; the rest are exclude-missing.
    const s = scoreProperty({ tenure: 'freehold' })
    expect(s.total).toBe(78) // (freehold 100 * 5 + neutral 50 * 4) / 9
    expect(s.confidence).toBeCloseTo(0.11, 2) // tenure weight 5 / intended 46
    const tenure = s.contributions.find((c) => c.key === 'tenure')
    const epc = s.contributions.find((c) => c.key === 'epc')
    expect(tenure?.missing).toBe(false)
    expect(epc?.missing).toBe(true)
    expect(s.contributions.find((c) => c.key === 'commute')).toBeUndefined() // excluded
  })

  it('respects zero weights', () => {
    const s = scoreProperty({ tenure: 'freehold' }, { tenure: 0, epc: 0 })
    expect(s.contributions).toHaveLength(0)
    expect(s.total).toBe(0)
  })
})

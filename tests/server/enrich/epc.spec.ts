import { describe, expect, it } from 'vitest'
import { deriveEpc, matchEpcRow } from '../../../server/services/enrich/epc'

const rows = [
  {
    address: '42 Smoke Test Road, London',
    'current-energy-rating': 'C',
    'potential-energy-rating': 'B',
    'total-floor-area': '66.9',
    uprn: '100',
    'inspection-date': '2022-01-01',
  },
  { address: '44 Smoke Test Road, London', 'current-energy-rating': 'D', 'total-floor-area': '70', uprn: '101' },
]

describe('matchEpcRow', () => {
  it('matches on building number with high confidence', () => {
    const m = matchEpcRow(rows, '42 Smoke Test Road, London')
    expect(m?.row.uprn).toBe('100')
    expect(m?.confidence ?? 0).toBeGreaterThanOrEqual(0.9)
  })
  it('returns null when nothing matches well', () => {
    expect(matchEpcRow(rows, 'Totally Different Place')).toBeNull()
    expect(matchEpcRow([], '42 x')).toBeNull()
    expect(matchEpcRow(rows, '')).toBeNull()
  })
})

describe('deriveEpc', () => {
  it('maps fields and converts m² to sqft', () => {
    expect(deriveEpc(rows[0]!)).toEqual({
      current: 'C',
      potential: 'B',
      floorAreaSqft: 720,
      uprn: '100',
      address: '42 Smoke Test Road, London',
      inspectionDate: '2022-01-01',
    })
  })
})

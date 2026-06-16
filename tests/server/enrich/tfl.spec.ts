import { describe, expect, it } from 'vitest'
import { blendCommute } from '../../../server/services/enrich/tfl'

describe('blendCommute', () => {
  it('computes an importance-weighted average', () => {
    expect(blendCommute([{ minutes: 30, importance: 3 }, { minutes: 60, importance: 1 }])).toBe(38)
  })
  it('ignores destinations with unknown minutes', () => {
    expect(blendCommute([{ minutes: null, importance: 3 }, { minutes: 20, importance: 2 }])).toBe(20)
  })
  it('returns null when nothing is known', () => {
    expect(blendCommute([])).toBeNull()
    expect(blendCommute([{ minutes: null, importance: 1 }])).toBeNull()
  })
})

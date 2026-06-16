import { describe, expect, it } from 'vitest'
import { properties } from '../../../server/db/schema'
import { scoreAllProperties } from '../../../server/services/scoring/dashboard'
import { makeTestDb } from '../../helpers/testDb'

describe('scoreAllProperties', () => {
  it('returns a score per saved property', async () => {
    const db = await makeTestDb()
    const a = (await db.insert(properties).values({ source: 'manual', tenure: 'freehold', floorAreaSqft: 900 }).returning({ id: properties.id }))[0]!.id
    const b = (await db.insert(properties).values({ source: 'manual', tenure: 'leasehold', leaseYearsRemaining: 70, floorAreaSqft: 500 }).returning({ id: properties.id }))[0]!.id

    const scores = await scoreAllProperties(db)
    expect(Object.keys(scores).sort()).toEqual([a, b].sort())
    expect(typeof scores[a]!.total).toBe('number')
    expect(scores[a]!.total).toBeGreaterThan(scores[b]!.total) // freehold + bigger scores higher
  })

  it('returns an empty map when there are no properties', async () => {
    const db = await makeTestDb()
    expect(await scoreAllProperties(db)).toEqual({})
  })
})

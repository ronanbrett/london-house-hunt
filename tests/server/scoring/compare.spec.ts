import { describe, expect, it } from 'vitest'
import { properties } from '../../../server/db/schema'
import { compareProperties } from '../../../server/services/scoring/compare'
import { makeTestDb } from '../../helpers/testDb'

describe('compareProperties', () => {
  it('builds a metric matrix with per-row winners', async () => {
    const db = await makeTestDb()
    const a = (
      await db
        .insert(properties)
        .values({ source: 'manual', displayAddress: 'A', tenure: 'freehold', floorAreaSqft: 1000, price: 500000 })
        .returning({ id: properties.id })
    )[0]!.id
    const b = (
      await db
        .insert(properties)
        .values({ source: 'manual', displayAddress: 'B', tenure: 'leasehold', leaseYearsRemaining: 60, floorAreaSqft: 500, price: 500000 })
        .returning({ id: properties.id })
    )[0]!.id

    const res = await compareProperties([a, b], {}, db)
    expect(res.columns).toHaveLength(2)
    expect(res.rows).toHaveLength(8)

    expect(res.rows.find((r) => r.key === 'tenure')?.bestId).toBe(a) // freehold > short leasehold
    expect(res.rows.find((r) => r.key === 'size')?.bestId).toBe(a) // 1000 > 500 sqft

    const colA = res.columns.find((c) => c.id === a)!
    const colB = res.columns.find((c) => c.id === b)!
    expect(colA.total).toBeGreaterThan(colB.total)
  })

  it('preserves the requested order', async () => {
    const db = await makeTestDb()
    const a = (await db.insert(properties).values({ source: 'manual', displayAddress: 'A' }).returning({ id: properties.id }))[0]!.id
    const b = (await db.insert(properties).values({ source: 'manual', displayAddress: 'B' }).returning({ id: properties.id }))[0]!.id
    const res = await compareProperties([b, a], {}, db)
    expect(res.columns.map((c) => c.displayAddress)).toEqual(['B', 'A'])
  })
})

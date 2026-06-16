import { describe, expect, it } from 'vitest'
import { properties } from '../../../server/db/schema'
import { computePropertyYield, getLatestRent, setRent } from '../../../server/services/yield/service'
import { makeTestDb } from '../../helpers/testDb'

describe('yield service', () => {
  it('stores rent and computes property yield from it', async () => {
    const db = await makeTestDb()
    const id = (
      await db
        .insert(properties)
        .values({ source: 'manual', price: 500000, serviceChargeAnnual: 1800 })
        .returning({ id: properties.id })
    )[0]!.id

    expect(await computePropertyYield(id, {}, db)).toEqual({ hasRent: false })

    await setRent(id, 2000, db)
    expect(await getLatestRent(id, db)).toBe(2000)

    const y = await computePropertyYield(id, {}, db)
    expect(y.hasRent).toBe(true)
    if (y.hasRent) {
      expect(y.grossYield).toBe(4.8)
      expect(y.monthlyRent).toBe(2000)
      expect(y.investmentScore).toBeGreaterThan(0)
    }
  })

  it('returns hasRent:false when the property has no price', async () => {
    const db = await makeTestDb()
    const id = (await db.insert(properties).values({ source: 'manual' }).returning({ id: properties.id }))[0]!.id
    await setRent(id, 2000, db)
    expect(await computePropertyYield(id, {}, db)).toEqual({ hasRent: false })
  })
})

import { describe, expect, it } from 'vitest'
import { profiles } from '../../../server/db/schema'
import {
  ensureDefaultProfile,
  getEffectiveWeights,
  setDefaultWeights,
} from '../../../server/services/scoring/profiles'
import { makeTestDb } from '../../helpers/testDb'

describe('scoring profiles', () => {
  it('creates the default profile once (idempotent)', async () => {
    const db = await makeTestDb()
    const a = await ensureDefaultProfile(db)
    const b = await ensureDefaultProfile(db)
    expect(a).toBe(b)
    expect(await db.select().from(profiles)).toHaveLength(1)
  })

  it('falls back to metric defaults, then reflects saved overrides', async () => {
    const db = await makeTestDb()
    const defaults = await getEffectiveWeights(db)
    expect(defaults.value).toBe(8) // value metric default
    expect(defaults.commute).toBe(7)

    await setDefaultWeights({ value: 10, commute: 0 }, db)
    const updated = await getEffectiveWeights(db)
    expect(updated.value).toBe(10)
    expect(updated.commute).toBe(0)
    expect(updated.tenure).toBe(5) // untouched -> still default
  })

  it('ignores unknown metric keys on save', async () => {
    const db = await makeTestDb()
    await setDefaultWeights({ value: 9, bogus: 5 }, db)
    const w = await getEffectiveWeights(db)
    expect(w.value).toBe(9)
    expect('bogus' in w).toBe(false)
  })
})

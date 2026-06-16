import { describe, expect, it } from 'vitest'
import { getOrFetch } from '../../../server/cache/snapshot'
import { properties } from '../../../server/db/schema'
import { makeTestDb } from '../../helpers/testDb'

async function seedProperty(db: Awaited<ReturnType<typeof makeTestDb>>) {
  const inserted = await db.insert(properties).values({ source: 'manual' }).returning({ id: properties.id })
  return inserted[0]!.id
}

describe('getOrFetch', () => {
  it('fetches fresh, then serves cached, refetches on force or new cacheKey', async () => {
    const db = await makeTestDb()
    const id = await seedProperty(db)
    let calls = 0
    const fetcher = async () => {
      calls++
      return { status: 'ok' as const, derived: { v: 42 } }
    }

    const r1 = await getOrFetch({ propertyId: id, source: 'police', cacheKey: 'k1', ttlDays: 30, fetcher, db })
    expect(r1.status).toBe('fresh')
    expect(r1.derived).toEqual({ v: 42 })
    expect(calls).toBe(1)

    const r2 = await getOrFetch({ propertyId: id, source: 'police', cacheKey: 'k1', ttlDays: 30, fetcher, db })
    expect(r2.status).toBe('cached')
    expect(r2.derived).toEqual({ v: 42 })
    expect(calls).toBe(1)

    const r3 = await getOrFetch({ propertyId: id, source: 'police', cacheKey: 'k1', ttlDays: 30, fetcher, db, force: true })
    expect(r3.status).toBe('fresh')
    expect(calls).toBe(2)

    const r4 = await getOrFetch({ propertyId: id, source: 'police', cacheKey: 'k2', ttlDays: 30, fetcher, db })
    expect(r4.status).toBe('fresh')
    expect(calls).toBe(3)
  })

  it('falls back to the last good snapshot on fetch error (stale-error)', async () => {
    const db = await makeTestDb()
    const id = await seedProperty(db)
    await getOrFetch({ propertyId: id, source: 'police', cacheKey: 'k', ttlDays: 30, fetcher: async () => ({ status: 'ok', derived: { v: 1 } }), db })
    const r = await getOrFetch({
      propertyId: id,
      source: 'police',
      cacheKey: 'k',
      ttlDays: 30,
      force: true,
      fetcher: async () => {
        throw new Error('boom')
      },
      db,
    })
    expect(r.status).toBe('stale-error')
    expect(r.derived).toEqual({ v: 1 })
  })

  it('records an error when there is no prior good snapshot', async () => {
    const db = await makeTestDb()
    const id = await seedProperty(db)
    const r = await getOrFetch({
      propertyId: id,
      source: 'flood',
      cacheKey: 'f',
      ttlDays: 30,
      fetcher: async () => {
        throw new Error('boom')
      },
      db,
    })
    expect(r.status).toBe('error')
  })

  it('caches no_match without refetching', async () => {
    const db = await makeTestDb()
    const id = await seedProperty(db)
    let calls = 0
    const fetcher = async () => {
      calls++
      return { status: 'no_match' as const }
    }
    expect((await getOrFetch({ propertyId: id, source: 'schools', cacheKey: 's', ttlDays: 30, fetcher, db })).status).toBe('no_match')
    expect((await getOrFetch({ propertyId: id, source: 'schools', cacheKey: 's', ttlDays: 30, fetcher, db })).status).toBe('no_match')
    expect(calls).toBe(1)
  })
})

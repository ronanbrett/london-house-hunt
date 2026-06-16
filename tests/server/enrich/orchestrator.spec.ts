import { afterEach, describe, expect, it, vi } from 'vitest'
import { properties } from '../../../server/db/schema'
import { enrichProperty, getLatestEnrichment } from '../../../server/services/enrich'
import { makeTestDb } from '../../helpers/testDb'

afterEach(() => vi.restoreAllMocks())

describe('enrichProperty', () => {
  it('runs police + flood, stores snapshots, exposes latest', async () => {
    const db = await makeTestDb()
    const inserted = await db
      .insert(properties)
      .values({ source: 'manual', lat: 51.46, lng: -0.16, postcode: 'SW11 2AB' })
      .returning({ id: properties.id })
    const id = inserted[0]!.id

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = String(url)
        if (u.includes('data.police.uk')) {
          return new Response(JSON.stringify([{ category: 'burglary', month: '2026-01' }]), { status: 200 })
        }
        if (u.includes('environment.data.gov.uk')) {
          return new Response(JSON.stringify({ items: [{ description: 'Thames', riverOrSea: 'River Thames' }] }), { status: 200 })
        }
        if (u.includes('api.tfl.gov.uk')) {
          return new Response(
            JSON.stringify({ stopPoints: [{ commonName: 'Clapham Junction Rail Station', distance: 400, modes: ['national-rail'] }] }),
            { status: 200 },
          )
        }
        return new Response('null', { status: 404 })
      }),
    )

    const statuses = await enrichProperty(id, { db })
    expect(statuses.police).toBe('fresh')
    expect(statuses.flood).toBe('fresh')
    expect(statuses.transit).toBe('fresh')
    expect(statuses.epc).toBe('skipped') // no EPC key configured in tests

    const latest = await getLatestEnrichment(id, db)
    expect(latest.police?.status).toBe('ok')
    expect((latest.police?.derived as { total: number }).total).toBe(1)
    expect((latest.flood?.derived as { areaCount: number }).areaCount).toBe(1)
    expect((latest.transit?.derived as { stations: unknown[] }).stations).toHaveLength(1)
  })

  it('skips sources when the property has no coordinates or key', async () => {
    const db = await makeTestDb()
    const inserted = await db.insert(properties).values({ source: 'manual' }).returning({ id: properties.id })
    const statuses = await enrichProperty(inserted[0]!.id, { db })
    expect(statuses.police).toBe('skipped')
    expect(statuses.flood).toBe('skipped')
    expect(statuses.transit).toBe('skipped')
    expect(statuses.epc).toBe('skipped')
  })
})

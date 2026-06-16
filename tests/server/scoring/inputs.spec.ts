import { describe, expect, it } from 'vitest'
import { comparables, enrichmentSnapshots, properties } from '../../../server/db/schema'
import { gatherMetricInputs } from '../../../server/services/scoring/inputs'
import { makeTestDb } from '../../helpers/testDb'

describe('gatherMetricInputs', () => {
  it('assembles inputs from property + latest enrichment + comparables', async () => {
    const db = await makeTestDb()
    const ins = await db
      .insert(properties)
      .values({
        source: 'manual',
        price: 600000,
        beds: 2,
        floorAreaSqft: 700,
        tenure: 'leasehold',
        leaseYearsRemaining: 90,
        epcCurrent: 'D',
      })
      .returning({ id: properties.id })
    const id = ins[0]!.id

    await db.insert(enrichmentSnapshots).values([
      { propertyId: id, source: 'transit', status: 'ok', derivedJson: { stations: [{ name: 'X', distanceMiles: 0.3 }] } },
      { propertyId: id, source: 'police', status: 'ok', derivedJson: { total: 120 } },
      { propertyId: id, source: 'flood', status: 'ok', derivedJson: { areaCount: 0 } },
      { propertyId: id, source: 'tfl', status: 'ok', derivedJson: { blendedMinutes: 28 } },
      { propertyId: id, source: 'epc', status: 'ok', derivedJson: { current: 'C' } },
    ])
    await db.insert(comparables).values({ propertyId: id, deltaPct: 0.05 })

    const input = await gatherMetricInputs(id, db)
    expect(input).toMatchObject({
      tenure: 'leasehold',
      leaseYearsRemaining: 90,
      epcCurrent: 'C', // EPC enrichment overrides the imported 'D'
      nearestStationMiles: 0.3,
      commuteMinutes: 28,
      crimeTotal: 120,
      floodAreaCount: 0,
      valueDeltaPct: 0.05,
    })
  })

  it('returns null for an unknown property', async () => {
    const db = await makeTestDb()
    expect(await gatherMetricInputs('nope', db)).toBeNull()
  })
})

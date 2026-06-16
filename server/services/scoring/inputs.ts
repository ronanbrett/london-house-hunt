import { desc, eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { comparables, properties } from '../../db/schema'
import { getLatestEnrichment } from '../enrich'
import { computeYield } from '../yield/estimate'
import { getLatestRent } from '../yield/service'
import type { MetricInput } from './metrics'

/** Assemble the flat metric inputs for a property from its row + latest enrichment + latest comps. */
export async function gatherMetricInputs(
  propertyId: string,
  db: AppDatabase = useDb(),
): Promise<MetricInput | null> {
  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  if (!prop) return null

  const enr = await getLatestEnrichment(propertyId, db)
  const [comp] = await db
    .select()
    .from(comparables)
    .where(eq(comparables.propertyId, propertyId))
    .orderBy(desc(comparables.computedAt))
    .limit(1)

  const transit = enr.transit?.derived as { stations?: { distanceMiles?: number }[] } | undefined
  const tfl = enr.tfl?.derived as { blendedMinutes?: number | null } | undefined
  const police = enr.police?.derived as { total?: number } | undefined
  const flood = enr.flood?.derived as { areaCount?: number } | undefined
  const epc = enr.epc?.derived as { current?: string } | undefined

  const monthlyRent = await getLatestRent(propertyId, db)
  const netYieldPct =
    monthlyRent && prop.price
      ? computeYield({
          price: prop.price,
          monthlyRent,
          serviceChargeAnnual: prop.serviceChargeAnnual,
          groundRentAnnual: prop.groundRentAnnual,
        }).netYield
      : null

  return {
    price: prop.price,
    beds: prop.beds,
    floorAreaSqft: prop.floorAreaSqft,
    tenure: prop.tenure,
    leaseYearsRemaining: prop.leaseYearsRemaining,
    epcCurrent: epc?.current ?? prop.epcCurrent,
    nearestStationMiles: transit?.stations?.[0]?.distanceMiles ?? null,
    commuteMinutes: tfl?.blendedMinutes ?? null,
    crimeTotal: police?.total ?? null,
    floodAreaCount: flood?.areaCount ?? null,
    valueDeltaPct: comp?.deltaPct ?? null,
    netYieldPct,
  }
}

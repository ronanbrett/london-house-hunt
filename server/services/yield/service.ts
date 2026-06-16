import { desc, eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { properties, rentEstimates } from '../../db/schema'
import { type YieldResult, computeYield, investmentScore } from './estimate'

export async function setRent(
  propertyId: string,
  monthlyRent: number,
  db: AppDatabase = useDb(),
): Promise<void> {
  await db.insert(rentEstimates).values({ propertyId, monthlyRent, source: 'user' })
}

export async function getLatestRent(propertyId: string, db: AppDatabase = useDb()): Promise<number | null> {
  const [row] = await db
    .select()
    .from(rentEstimates)
    .where(eq(rentEstimates.propertyId, propertyId))
    .orderBy(desc(rentEstimates.computedAt))
    .limit(1)
  return row?.monthlyRent ?? null
}

export interface PropertyYield extends YieldResult {
  hasRent: true
  monthlyRent: number
  rentSource: string
  investmentScore: number
}

/** Compute yield for a property from its latest stored rent + price + carrying costs. */
export async function computePropertyYield(
  propertyId: string,
  opts: { monthlyRent?: number; managed?: boolean } = {},
  db: AppDatabase = useDb(),
): Promise<PropertyYield | { hasRent: false }> {
  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  if (!prop || !prop.price) return { hasRent: false }

  const monthlyRent = opts.monthlyRent ?? (await getLatestRent(propertyId, db))
  if (!monthlyRent) return { hasRent: false }

  const result = computeYield({
    price: prop.price,
    monthlyRent,
    serviceChargeAnnual: prop.serviceChargeAnnual,
    groundRentAnnual: prop.groundRentAnnual,
    managed: opts.managed,
  })
  return { hasRent: true, monthlyRent, rentSource: 'user', investmentScore: investmentScore(result.netYield), ...result }
}

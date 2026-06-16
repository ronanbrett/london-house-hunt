import { type AppDatabase, useDb } from '../../db/client'
import { properties } from '../../db/schema'
import { gatherMetricInputs } from './inputs'
import { getEffectiveWeights } from './profiles'
import { scoreProperty } from './score'

/** Score every saved property with the default profile's weights (for the dashboard list). */
export async function scoreAllProperties(
  db: AppDatabase = useDb(),
): Promise<Record<string, { total: number; confidence: number }>> {
  const weights = await getEffectiveWeights(db)
  const rows = await db.select({ id: properties.id }).from(properties)
  const out: Record<string, { total: number; confidence: number }> = {}
  for (const r of rows) {
    const input = await gatherMetricInputs(r.id, db)
    if (input) {
      const s = scoreProperty(input, weights)
      out[r.id] = { total: s.total, confidence: s.confidence }
    }
  }
  return out
}

import { eq } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { profiles, profileWeights } from '../../db/schema'
import { METRICS } from './metrics'

/** Ensure the single default "Home to live in" profile exists; return its id. */
export async function ensureDefaultProfile(db: AppDatabase = useDb()): Promise<string> {
  const [existing] = await db.select().from(profiles).where(eq(profiles.isDefault, true)).limit(1)
  if (existing) return existing.id
  const [created] = await db
    .insert(profiles)
    .values({ name: 'Home to live in', isDefault: true })
    .returning({ id: profiles.id })
  if (!created) throw new Error('Failed to create default profile')
  return created.id
}

/** Effective weights for the default profile: stored override per metric, else its default weight. */
export async function getEffectiveWeights(db: AppDatabase = useDb()): Promise<Record<string, number>> {
  const profileId = await ensureDefaultProfile(db)
  const rows = await db.select().from(profileWeights).where(eq(profileWeights.profileId, profileId))
  const stored = new Map(rows.map((r) => [r.metricKey, r.weight]))
  const out: Record<string, number> = {}
  for (const m of METRICS) out[m.key] = stored.get(m.key) ?? m.defaultWeight
  return out
}

/** Replace the default profile's weights. */
export async function setDefaultWeights(
  weights: Record<string, number>,
  db: AppDatabase = useDb(),
): Promise<void> {
  const profileId = await ensureDefaultProfile(db)
  await db.delete(profileWeights).where(eq(profileWeights.profileId, profileId))
  const known = new Set(METRICS.map((m) => m.key))
  const values = Object.entries(weights)
    .filter(([key]) => known.has(key))
    .map(([metricKey, weight]) => ({ profileId, metricKey, weight }))
  if (values.length) await db.insert(profileWeights).values(values)
}

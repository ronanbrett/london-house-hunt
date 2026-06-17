import { eq } from 'drizzle-orm'
import { properties } from '../../../db/schema'
import { computeValue } from '../../../services/value/comparables'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const db = useDb()
  const [prop] = await db.select().from(properties).where(eq(properties.id, id)).limit(1)
  if (!prop) throw createError({ statusCode: 404, statusMessage: 'Property not found' })

  const result = await computeValue(prop, db)
  return result ?? { sampleSize: 0, fairValue: 0, fairValueLow: 0, fairValueHigh: 0, deltaPct: null, verdict: null, valueScore: null, hpiAdjusted: false, sizeAdjusted: false, medianPpsf: null, comps: [] }
})

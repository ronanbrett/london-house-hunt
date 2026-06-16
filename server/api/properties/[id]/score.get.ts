import { gatherMetricInputs } from '../../../services/scoring/inputs'
import { getEffectiveWeights } from '../../../services/scoring/profiles'
import { scoreProperty } from '../../../services/scoring/score'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const db = useDb()
  const input = await gatherMetricInputs(id, db)
  if (!input) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  return scoreProperty(input, await getEffectiveWeights(db))
})

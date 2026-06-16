import { gatherMetricInputs } from '../../../services/scoring/inputs'
import { scoreProperty } from '../../../services/scoring/score'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const input = await gatherMetricInputs(id)
  if (!input) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  // Default "Home to live in" weighting (metric defaults). Profile weights wire in with T4.4.
  return scoreProperty(input)
})

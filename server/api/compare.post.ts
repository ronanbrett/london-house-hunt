import { z } from 'zod'
import { compareProperties } from '../services/scoring/compare'

const Body = z.object({
  ids: z.array(z.string()).min(1),
  weights: z.record(z.string(), z.number()).optional(),
})

export default defineEventHandler(async (event) => {
  const { ids, weights } = await readValidatedBody(event, Body.parse)
  return compareProperties(ids, weights ?? {})
})

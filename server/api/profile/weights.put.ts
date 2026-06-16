import { z } from 'zod'
import { setDefaultWeights } from '../../services/scoring/profiles'

const Body = z.object({ weights: z.record(z.string(), z.number().min(0).max(10)) })

export default defineEventHandler(async (event) => {
  const { weights } = await readValidatedBody(event, Body.parse)
  await setDefaultWeights(weights)
  return { ok: true }
})

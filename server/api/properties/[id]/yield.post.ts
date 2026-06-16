import { z } from 'zod'
import { computePropertyYield, setRent } from '../../../services/yield/service'

const Body = z.object({
  monthlyRent: z.number().positive(),
  managed: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const { monthlyRent, managed } = await readValidatedBody(event, Body.parse)
  await setRent(id, monthlyRent)
  return computePropertyYield(id, { monthlyRent, managed })
})

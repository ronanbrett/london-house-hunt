import { z } from 'zod'
import { updateStatus } from '../../../services/properties/repo'

const Body = z.object({
  status: z.enum(['active', 'shortlisted', 'viewed', 'rejected', 'offered', 'archived', 'sold']),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const { status } = await readValidatedBody(event, Body.parse)
  const ok = await updateStatus(id, status)
  if (!ok) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  return { ok: true }
})

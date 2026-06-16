import { z } from 'zod'
import { createDestination } from '../../services/destinations/repo'

const Body = z.object({
  label: z.string().min(1),
  postcode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  mode: z.enum(['transit', 'cycling', 'walking', 'driving']).optional(),
  importance: z.number().int().min(1).max(5).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  return createDestination(body)
})

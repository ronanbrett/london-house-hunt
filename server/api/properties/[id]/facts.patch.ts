import { z } from 'zod'
import { TenureSchema } from '../../../../shared/types/canonical'
import { updateFacts } from '../../../services/properties/repo'

const Body = z.object({
  price: z.number().int().nonnegative().nullable().optional(),
  priceQualifier: z.string().nullable().optional(),
  beds: z.number().int().nonnegative().nullable().optional(),
  baths: z.number().int().nonnegative().nullable().optional(),
  receptions: z.number().int().nonnegative().nullable().optional(),
  floorAreaSqft: z.number().nonnegative().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  tenure: TenureSchema.nullable().optional(),
  leaseYearsRemaining: z.number().int().nonnegative().nullable().optional(),
  serviceChargeAnnual: z.number().int().nonnegative().nullable().optional(),
  groundRentAnnual: z.number().int().nonnegative().nullable().optional(),
  councilTaxBand: z.string().nullable().optional(),
  epcCurrent: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const fields = await readValidatedBody(event, Body.parse)
  const ok = await updateFacts(id, fields)
  if (!ok) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  return { ok: true }
})

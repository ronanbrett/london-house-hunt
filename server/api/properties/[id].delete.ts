import { deleteProperty } from '../../services/properties/repo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const ok = await deleteProperty(id)
  if (!ok) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  return { ok: true }
})

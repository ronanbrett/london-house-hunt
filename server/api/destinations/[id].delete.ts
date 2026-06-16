import { deleteDestination } from '../../services/destinations/repo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const ok = await deleteDestination(id)
  if (!ok) throw createError({ statusCode: 404, statusMessage: 'Destination not found' })
  return { ok: true }
})

import { enrichProperty } from '../../../services/enrich'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const q = getQuery(event)
  const force = q.force === 'true' || q.force === '1'
  try {
    return await enrichProperty(id, { force })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  }
})

import { getProperty } from '../../services/properties/repo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const bundle = await getProperty(id)
  if (!bundle) throw createError({ statusCode: 404, statusMessage: 'Property not found' })
  return bundle
})

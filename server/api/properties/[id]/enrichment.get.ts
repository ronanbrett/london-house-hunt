import { getLatestEnrichment } from '../../../services/enrich'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  return getLatestEnrichment(id)
})

import { z } from 'zod'
import { persistListing } from '../../services/import/persist'
import { mapRightmoveModel } from '../../services/import/rightmove'
import { mapZooplaData } from '../../services/import/zoopla'

// No method suffix so this handler also answers the CORS preflight (OPTIONS) the bookmarklet
// triggers when POSTing JSON cross-origin from rightmove.co.uk / zoopla.co.uk.
const Body = z.object({
  portal: z.enum(['rightmove', 'zoopla']),
  data: z.any(),
  url: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  })
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return null
  }
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const { portal, data, url } = await readValidatedBody(event, Body.parse)
  const listing = portal === 'rightmove' ? mapRightmoveModel(data, url) : mapZooplaData(data, url)
  const id = await persistListing(listing)
  return { id }
})

import { z } from 'zod'
import { detectPortal } from '../../services/import/detect'
import { ImportParseError } from '../../services/import/errors'
import { fetchPage } from '../../services/import/fetchPage'
import { persistListing } from '../../services/import/persist'
import { parseRightmoveHtml } from '../../services/import/rightmove'
import { parseZooplaHtml } from '../../services/import/zoopla'

const Body = z.object({ url: z.url() })

export default defineEventHandler(async (event) => {
  const { url } = await readValidatedBody(event, Body.parse)

  const portal = detectPortal(url)
  if (portal === 'unknown') {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Only Rightmove and Zoopla links are supported. Use the bookmarklet or add the property manually.',
    })
  }

  let html: string
  try {
    html = await fetchPage(url)
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Could not fetch that page — the portal may be blocking automated requests. Try the bookmarklet or manual entry.',
    })
  }

  try {
    const listing = portal === 'rightmove' ? parseRightmoveHtml(html, url) : parseZooplaHtml(html, url)
    const id = await persistListing(listing)
    return { id }
  } catch (err) {
    if (err instanceof ImportParseError) {
      throw createError({
        statusCode: 422,
        statusMessage: `${err.message}. Try the bookmarklet or manual entry.`,
      })
    }
    throw err
  }
})

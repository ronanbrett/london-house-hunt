import { CanonicalListingSchema } from '#shared/types/canonical'
import { persistListing } from '../../services/import/persist'

export default defineEventHandler(async (event) => {
  const listing = await readValidatedBody(event, (b) =>
    CanonicalListingSchema.parse({ ...(b as Record<string, unknown>), source: 'manual' }),
  )
  const id = await persistListing(listing)
  return { id }
})

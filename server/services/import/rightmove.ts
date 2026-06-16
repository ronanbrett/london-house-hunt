import { type CanonicalListing, CanonicalListingSchema } from '#shared/types/canonical'
import { ImportParseError } from './errors'
import { extractAssignedObject } from './extract'
import { isoToEpoch, normalizeTenure, num, parseMoney, sqftFromRightmoveSizings, stripHtml } from './helpers'

/**
 * Map a Rightmove `window.PAGE_MODEL` object into a CanonicalListing.
 * Used by both the server-fetch path and the bookmarklet (which posts the raw model).
 * Defensive: every field is optional and missing data is simply omitted.
 */
export function mapRightmoveModel(model: any, sourceUrl?: string): CanonicalListing {
  const pd = model?.propertyData ?? model ?? {}
  const address = pd.address ?? {}
  const postcode = [address.outcode, address.incode].filter(Boolean).join(' ') || undefined

  const photos = (Array.isArray(pd.images) ? pd.images : [])
    .map((im: any) => ({ kind: 'photo' as const, url: im?.url, caption: im?.caption ?? undefined }))
    .filter((m: any) => typeof m.url === 'string')
  const floorplans = (Array.isArray(pd.floorplans) ? pd.floorplans : [])
    .map((fp: any) => ({ kind: 'floorplan' as const, url: fp?.url, caption: fp?.caption ?? undefined }))
    .filter((m: any) => typeof m.url === 'string')
  const stations = (Array.isArray(pd.nearestStations) ? pd.nearestStations : [])
    .map((s: any) => ({
      name: s?.name,
      type: Array.isArray(s?.types) ? s.types[0] : s?.type,
      distanceMiles: num(s?.distance),
    }))
    .filter((s: any) => typeof s.name === 'string')

  return CanonicalListingSchema.parse({
    source: 'rightmove',
    sourceUrl,
    sourceId: pd.id != null ? String(pd.id) : undefined,
    displayAddress: address.displayAddress ?? undefined,
    postcode,
    lat: num(pd.location?.latitude),
    lng: num(pd.location?.longitude),
    price: parseMoney(pd.prices?.primaryPrice ?? pd.prices?.price),
    priceQualifier: pd.prices?.displayPriceQualifier || undefined,
    propertyType: pd.propertySubType || pd.propertyType || undefined,
    tenure: normalizeTenure(pd.tenure?.tenureType),
    leaseYearsRemaining: num(pd.tenure?.yearsRemainingOnLease),
    serviceChargeAnnual: parseMoney(pd.livingCosts?.annualServiceCharge),
    groundRentAnnual: parseMoney(pd.livingCosts?.annualGroundRent),
    beds: num(pd.bedrooms),
    baths: num(pd.bathrooms),
    floorAreaSqft: sqftFromRightmoveSizings(pd.sizings),
    councilTaxBand: pd.livingCosts?.councilTaxBand || undefined,
    description: stripHtml(pd.text?.description),
    agentName: pd.customer?.branchDisplayName || pd.customer?.companyName || undefined,
    firstListedAt: isoToEpoch(pd.firstVisibleDate),
    photos,
    floorplans,
    stations,
  })
}

/** Parse a fetched Rightmove HTML page into a CanonicalListing. */
export function parseRightmoveHtml(html: string, sourceUrl?: string): CanonicalListing {
  const json = extractAssignedObject(html, 'PAGE_MODEL')
  if (!json) throw new ImportParseError('Could not find PAGE_MODEL in the Rightmove page')
  let model: unknown
  try {
    model = JSON.parse(json)
  } catch {
    throw new ImportParseError('Rightmove PAGE_MODEL was not valid JSON')
  }
  return mapRightmoveModel(model, sourceUrl)
}

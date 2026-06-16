import { type CanonicalListing, CanonicalListingSchema, type Media } from '#shared/types/canonical'
import { normalizePostcode } from '../geo/postcode'
import { ImportParseError } from './errors'
import { extractNextData } from './extract'
import { isoToEpoch, normalizeTenure, num, parseMoney, SQM_TO_SQFT, stripHtml } from './helpers'

/**
 * Zoopla embeds listing data in `__NEXT_DATA__`. The exact path drifts between releases, so we
 * search the object graph for the listing node defensively.
 * NOTE: field coverage is best-effort and should be validated against a saved real page (task X2).
 */
function findListing(root: any): any | null {
  const seen = new Set<unknown>()
  const stack: unknown[] = [root]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    const keys = Object.keys(node as object)
    const hasId = keys.includes('listingId') || keys.includes('listingUris')
    const hasDetail =
      keys.includes('pricing') ||
      keys.includes('price') ||
      keys.includes('priceLabel') ||
      keys.includes('displayAddress') ||
      keys.includes('address')
    if (hasId && hasDetail) return node
    for (const k of keys) {
      const v = (node as any)[k]
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  return null
}

function toMedia(arr: unknown, kind: Media['kind']): Media[] {
  if (!Array.isArray(arr)) return []
  const out: Media[] = []
  for (const raw of arr as any[]) {
    const url = typeof raw === 'string' ? raw : (raw?.url ?? raw?.src ?? raw?.original ?? raw?.filename)
    if (typeof url !== 'string') continue
    const caption = raw && typeof raw === 'object' ? (raw.caption ?? undefined) : undefined
    out.push({ kind, url, caption })
  }
  return out
}

function floorAreaSqft(d: any): number | undefined {
  const fa = d.floorArea ?? d.size
  if (typeof fa === 'number') return Math.round(fa)
  const value = num(fa?.value ?? fa?.min)
  if (!value) return undefined
  const unit = String(fa?.units ?? fa?.unit ?? '').toLowerCase()
  if (unit.includes('m')) return Math.round(value * SQM_TO_SQFT)
  return Math.round(value)
}

export function mapZooplaData(nextData: any, sourceUrl?: string): CanonicalListing {
  const d = findListing(nextData?.props?.pageProps ?? nextData) ?? {}
  const address = d.address ?? {}
  const coords = d.location?.coordinates ?? d.coordinates ?? {}

  return CanonicalListingSchema.parse({
    source: 'zoopla',
    sourceUrl,
    sourceId: d.listingId != null ? String(d.listingId) : undefined,
    displayAddress: address.label ?? d.displayAddress ?? d.title ?? undefined,
    postcode: normalizePostcode(address.postcode ?? d.postcode),
    lat: num(coords.latitude ?? d.latitude),
    lng: num(coords.longitude ?? d.longitude),
    price: parseMoney(d.pricing?.value ?? d.price ?? d.priceLabel ?? d.pricing?.label),
    priceQualifier: d.pricing?.qualifier ?? d.priceQualifier ?? undefined,
    propertyType: d.propertyType ?? d.category ?? undefined,
    tenure: normalizeTenure(d.tenure),
    beds: num(d.bedrooms ?? d.counts?.numBedrooms),
    baths: num(d.bathrooms ?? d.counts?.numBathrooms),
    receptions: num(d.receptions ?? d.counts?.numLivingRooms),
    floorAreaSqft: floorAreaSqft(d),
    description: stripHtml(d.detailedDescription ?? d.description),
    agentName: d.branch?.name ?? d.agent?.name ?? undefined,
    firstListedAt: isoToEpoch(d.publishedOn ?? d.firstPublishedDate),
    photos: toMedia(d.images ?? d.gallery ?? d.photos, 'photo'),
    floorplans: toMedia(d.floorPlans ?? d.floorplans, 'floorplan'),
    stations: [],
  })
}

/** Parse a fetched Zoopla HTML page into a CanonicalListing. */
export function parseZooplaHtml(html: string, sourceUrl?: string): CanonicalListing {
  const next = extractNextData(html)
  if (!next) throw new ImportParseError('Could not find __NEXT_DATA__ in the Zoopla page')
  return mapZooplaData(next, sourceUrl)
}

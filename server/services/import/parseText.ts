import type { Tenure } from '#shared/types/canonical'
import { normalizePostcode } from '../geo/postcode'
import { normalizeTenure, parseMoney, SQM_TO_SQFT } from './helpers'

export interface ParsedTextFields {
  price?: number
  beds?: number
  baths?: number
  receptions?: number
  floorAreaSqft?: number
  postcode?: string
  tenure?: Tenure
  leaseYearsRemaining?: number
}

const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i

/**
 * Best-effort extraction of structured fields from pasted listing text, to pre-fill the manual
 * form. Purely local (no network). Anything not found is left undefined for the user to complete.
 */
export function parsePastedText(text: string): ParsedTextFields {
  const out: ParsedTextFields = {}
  if (!text) return out
  const t = text.replace(new RegExp(String.fromCharCode(160), "g"), " ")

  const price = t.match(/£\s?([\d,]+(?:\.\d+)?)/)
  if (price) out.price = parseMoney(price[1])

  const beds = t.match(/(\d+)\s*(?:bed|bedroom)/i)
  if (beds) out.beds = parseInt(beds[1], 10)

  const baths = t.match(/(\d+)\s*(?:bath|bathroom)/i)
  if (baths) out.baths = parseInt(baths[1], 10)

  const recep = t.match(/(\d+)\s*reception/i)
  if (recep) out.receptions = parseInt(recep[1], 10)

  const sqft = t.match(/([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s?ft|sqft|square\s?feet)/i)
  if (sqft) {
    out.floorAreaSqft = Math.round(parseFloat(sqft[1].replace(/,/g, '')))
  } else {
    const sqm = t.match(/([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s?m|sqm|square\s?met)/i)
    if (sqm) out.floorAreaSqft = Math.round(parseFloat(sqm[1].replace(/,/g, '')) * SQM_TO_SQFT)
  }

  const pc = t.match(UK_POSTCODE)
  if (pc) out.postcode = normalizePostcode(pc[0])

  const tenure = normalizeTenure(t)
  if (tenure) out.tenure = tenure

  const lease = t.match(/(\d{2,3})\s*years?\s*(?:remaining|left|lease)/i)
  if (lease) out.leaseYearsRemaining = parseInt(lease[1], 10)

  return out
}

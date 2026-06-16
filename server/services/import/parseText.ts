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
  const t = text.replace(new RegExp(String.fromCharCode(160), 'g'), ' ')

  const priceM = t.match(/£\s?([\d,]+(?:\.\d+)?)/)?.[1]
  if (priceM) out.price = parseMoney(priceM)

  const bedsM = t.match(/(\d+)\s*(?:bed|bedroom)/i)?.[1]
  if (bedsM) out.beds = parseInt(bedsM, 10)

  const bathsM = t.match(/(\d+)\s*(?:bath|bathroom)/i)?.[1]
  if (bathsM) out.baths = parseInt(bathsM, 10)

  const recepM = t.match(/(\d+)\s*reception/i)?.[1]
  if (recepM) out.receptions = parseInt(recepM, 10)

  const sqftM = t.match(/([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s?ft|sqft|square\s?feet)/i)?.[1]
  if (sqftM) {
    out.floorAreaSqft = Math.round(parseFloat(sqftM.replace(/,/g, '')))
  } else {
    const sqmM = t.match(/([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s?m|sqm|square\s?met)/i)?.[1]
    if (sqmM) out.floorAreaSqft = Math.round(parseFloat(sqmM.replace(/,/g, '')) * SQM_TO_SQFT)
  }

  const pcM = t.match(UK_POSTCODE)?.[0]
  if (pcM) out.postcode = normalizePostcode(pcM)

  const tenure = normalizeTenure(t)
  if (tenure) out.tenure = tenure

  const leaseM = t.match(/(\d{2,3})\s*years?\s*(?:remaining|left|lease)/i)?.[1]
  if (leaseM) out.leaseYearsRemaining = parseInt(leaseM, 10)

  return out
}

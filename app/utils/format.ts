/** Format integer pounds as GBP (no decimals). */
export function formatGBP(pounds?: number | null): string {
  if (pounds == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(pounds)
}

export type AreaUnit = 'sqft' | 'sqm'

const SQFT_TO_SQM = 0.092903

export function sqftToSqm(sqft: number): number {
  return sqft * SQFT_TO_SQM
}

export function sqmToSqft(sqm: number): number {
  return sqm / SQFT_TO_SQM
}

export function formatArea(sqft?: number | null, unit: AreaUnit = 'sqft'): string {
  if (sqft == null) return '—'
  if (unit === 'sqm') {
    return `${Math.round(sqftToSqm(sqft)).toLocaleString('en-GB')} m²`
  }
  return `${sqft.toLocaleString('en-GB')} sq ft`
}

export function pricePerArea(price?: number | null, sqft?: number | null, unit: AreaUnit = 'sqft'): string {
  if (!price || !sqft) return '—'
  if (unit === 'sqm') {
    const sqm = sqftToSqm(sqft)
    return `£${Math.round(price / sqm).toLocaleString('en-GB')}/m²`
  }
  return `£${Math.round(price / sqft).toLocaleString('en-GB')}/sq ft`
}

/** @deprecated Use pricePerArea instead */
export function pricePerSqft(price?: number | null, sqft?: number | null): string {
  return pricePerArea(price, sqft, 'sqft')
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'neutral',
  shortlisted: 'primary',
  viewed: 'info',
  rejected: 'error',
  offered: 'warning',
  archived: 'neutral',
  sold: 'success',
}

export const PROPERTY_STATUSES = [
  'active',
  'shortlisted',
  'viewed',
  'rejected',
  'offered',
  'archived',
  'sold',
] as const

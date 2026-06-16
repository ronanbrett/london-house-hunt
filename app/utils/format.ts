/** Format integer pounds as GBP (no decimals). */
export function formatGBP(pounds?: number | null): string {
  if (pounds == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(pounds)
}

/** Format £/sq ft from price + floor area, or em dash when not computable. */
export function pricePerSqft(price?: number | null, sqft?: number | null): string {
  if (!price || !sqft) return '—'
  return `£${Math.round(price / sqft).toLocaleString('en-GB')}/sq ft`
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

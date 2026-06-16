import type { Tenure } from '#shared/types/canonical'

export const SQM_TO_SQFT = 10.7639

/** Parse a money value into integer POUNDS. Accepts "£750,000", "750000", numbers, etc. */
export function parseMoney(input?: string | number | null): number | undefined {
  if (input == null) return undefined
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input) : undefined
  const cleaned = input.replace(/[^0-9.]/g, '')
  if (!cleaned) return undefined
  const n = Math.round(parseFloat(cleaned))
  return Number.isFinite(n) ? n : undefined
}

/** Normalise a free-text or enum tenure into our canonical enum. */
export function normalizeTenure(raw?: string | null): Tenure | undefined {
  if (!raw) return undefined
  const s = raw.toLowerCase()
  if (s.includes('share') && s.includes('freehold')) return 'share_of_freehold'
  if (s.includes('freehold')) return 'freehold'
  if (s.includes('leasehold')) return 'leasehold'
  return undefined
}

/** Strip HTML tags + decode a few common entities; collapse whitespace. */
export function stripHtml(input?: string | null): string | undefined {
  if (!input) return undefined
  const text = input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return text || undefined
}

export function isoToEpoch(input?: string | null): number | undefined {
  if (!input) return undefined
  const t = Date.parse(input)
  return Number.isNaN(t) ? undefined : t
}

/** Numeric guard — returns the value only if it's a finite number. */
export function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Pick a square-footage from Rightmove's `sizings` array (prefers sqft, converts sqm). */
export function sqftFromRightmoveSizings(sizings?: unknown): number | undefined {
  if (!Array.isArray(sizings)) return undefined
  const byUnit = (unit: string) =>
    sizings.find((s) => String((s as any)?.unit ?? '').toLowerCase().replace(/\s/g, '') === unit)
  const sqft = byUnit('sqft')
  const sqftVal = num((sqft as any)?.maximumSize) ?? num((sqft as any)?.minimumSize)
  if (sqftVal && sqftVal > 0) return Math.round(sqftVal)
  const sqm = byUnit('sqm')
  const sqmVal = num((sqm as any)?.maximumSize) ?? num((sqm as any)?.minimumSize)
  if (sqmVal && sqmVal > 0) return Math.round(sqmVal * SQM_TO_SQFT)
  return undefined
}

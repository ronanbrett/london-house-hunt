// Normalisers — turn a raw metric value onto a common 0–100 scale.

/** Anchored linear: 100 at `best`, 0 at `worst` (works for either direction by ordering anchors). */
export function linearScore(x: number, best: number, worst: number): number {
  if (best === worst) return 50
  return Math.max(0, Math.min(100, Math.round((100 * (x - worst)) / (best - worst))))
}

/** Categorical lookup (case-insensitive); null when the key isn't in the table. */
export function mappedScore(key: string, table: Record<string, number>): number | null {
  const v = table[key.trim().toUpperCase()]
  return v == null ? null : v
}

export interface Band {
  upTo: number
  score: number
}

/** First band whose `upTo` the value falls within (ascending), else `floor`. */
export function thresholdScore(x: number, bands: Band[], floor = 5): number {
  for (const b of bands) if (x <= b.upTo) return b.score
  return floor
}

const TENURE_BASE: Record<string, number> = {
  freehold: 100,
  share_of_freehold: 85,
  leasehold: 55,
  unknown: 50,
}

/** Years remaining → multiplier capturing the leasehold value cliff (esp. < 80 years). */
export function leaseFactor(years?: number | null): number {
  if (years == null) return 1
  if (years >= 125) return 1
  if (years >= 90) return 0.95
  if (years >= 80) return 0.85
  if (years >= 70) return 0.6
  return 0.3
}

export function leaseholdScore(tenure?: string | null, leaseYears?: number | null): number | null {
  if (!tenure) return null
  const base = TENURE_BASE[tenure] ?? 50
  return tenure === 'leasehold' ? Math.round(base * leaseFactor(leaseYears)) : base
}

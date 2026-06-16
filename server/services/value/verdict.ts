import type { Verdict } from '#shared/types/canonical'

/** Quantile of an already-sorted ascending array (linear interpolation). */
export function quantileSorted(sorted: number[], q: number): number {
  if (!sorted.length) return Number.NaN
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const lo = sorted[base]!
  const hi = sorted[base + 1] ?? lo
  return lo + (hi - lo) * (pos - base)
}

export function median(nums: number[]): number {
  return quantileSorted([...nums].sort((a, b) => a - b), 0.5)
}

export interface PriceSummary {
  sampleSize: number
  median: number
  iqrLow: number
  iqrHigh: number
}

export function summarisePrices(prices: number[]): PriceSummary | null {
  if (!prices.length) return null
  const s = [...prices].sort((a, b) => a - b)
  return {
    sampleSize: s.length,
    median: Math.round(quantileSorted(s, 0.5)),
    iqrLow: Math.round(quantileSorted(s, 0.25)),
    iqrHigh: Math.round(quantileSorted(s, 0.75)),
  }
}

/** Asking-vs-fair delta → verdict band. */
export function verdictFromDelta(deltaPct: number): Verdict {
  if (deltaPct < -0.1) return 'underpriced'
  if (deltaPct < -0.03) return 'slightly_below'
  if (deltaPct <= 0.03) return 'fair'
  if (deltaPct <= 0.1) return 'slightly_above'
  return 'overpriced'
}

/** 0–100, ~100 at/under fair value, falling to 0 around +20% over. */
export function valueScore(deltaPct: number): number {
  const d = Math.max(deltaPct, -0.05)
  return Math.max(0, Math.min(100, Math.round(100 - (d + 0.05) * 400)))
}

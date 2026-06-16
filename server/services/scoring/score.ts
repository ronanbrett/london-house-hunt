import { METRICS, type MetricInput } from './metrics'

export interface Contribution {
  key: string
  label: string
  category: string
  normalized: number // 0..100
  weight: number
  missing: boolean
}

export interface PropertyScore {
  total: number // 0..100
  confidence: number // 0..1 (share of intended weight backed by real data)
  contributions: Contribution[]
}

/**
 * Weighted 0–100 score. Missing metrics are excluded (and the remaining weights renormalise) or
 * filled with a neutral/penalty default per their policy. `confidence` = real-data weight / intended
 * weight, so a high score on thin data reads as low-confidence rather than silently misleading.
 */
export function scoreProperty(
  input: MetricInput,
  weights: Record<string, number> = {},
): PropertyScore {
  let weightedSum = 0
  let countedWeight = 0
  let usedWeight = 0
  let intendedWeight = 0
  const contributions: Contribution[] = []

  for (const m of METRICS) {
    const w = weights[m.key] ?? m.defaultWeight
    if (w <= 0) continue
    intendedWeight += w

    const raw = m.score(input)
    if (raw == null) {
      if (m.missingPolicy === 'exclude') continue
      const norm = m.missingPolicy === 'neutral' ? 50 : 20
      countedWeight += w
      weightedSum += norm * w
      contributions.push({ key: m.key, label: m.label, category: m.category, normalized: norm, weight: w, missing: true })
      continue
    }

    const norm = Math.max(0, Math.min(100, Math.round(raw)))
    countedWeight += w
    usedWeight += w
    weightedSum += norm * w
    contributions.push({ key: m.key, label: m.label, category: m.category, normalized: norm, weight: w, missing: false })
  }

  return {
    total: countedWeight > 0 ? Math.round(weightedSum / countedWeight) : 0,
    confidence: intendedWeight > 0 ? Math.round((usedWeight / intendedWeight) * 100) / 100 : 0,
    contributions,
  }
}

import { inArray } from 'drizzle-orm'
import { type AppDatabase, useDb } from '../../db/client'
import { properties } from '../../db/schema'
import { gatherMetricInputs } from './inputs'
import { METRICS } from './metrics'
import { scoreProperty } from './score'

export interface CompareColumn {
  id: string
  displayAddress: string | null
  price: number | null
  floorAreaSqft: number | null
  beds: number | null
  total: number
  confidence: number
}
export interface CompareCell {
  id: string
  value: number | null
}
export interface CompareRow {
  key: string
  label: string
  category: string
  cells: CompareCell[]
  bestId: string | null // highest normalized value in the row (higher is always better)
}
export interface CompareResult {
  columns: CompareColumn[]
  rows: CompareRow[]
}

/** Score each property and lay out a metric × property matrix with the per-row winner flagged. */
export async function compareProperties(
  ids: string[],
  weights: Record<string, number> = {},
  db: AppDatabase = useDb(),
): Promise<CompareResult> {
  const rows = ids.length ? await db.select().from(properties).where(inArray(properties.id, ids)) : []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is (typeof rows)[number] => !!p)

  const columns: CompareColumn[] = []
  const contributionsByProp = new Map<string, Map<string, { normalized: number; missing: boolean }>>()

  for (const p of ordered) {
    const input = await gatherMetricInputs(p.id, db)
    const score = input ? scoreProperty(input, weights) : { total: 0, confidence: 0, contributions: [] }
    contributionsByProp.set(p.id, new Map(score.contributions.map((c) => [c.key, c])))
    columns.push({
      id: p.id,
      displayAddress: p.displayAddress,
      price: p.price,
      floorAreaSqft: p.floorAreaSqft,
      beds: p.beds,
      total: score.total,
      confidence: score.confidence,
    })
  }

  // Only show metrics that actually count (weight > 0) — keeps off-by-default metrics out of the grid.
  const activeMetrics = METRICS.filter((m) => (weights[m.key] ?? m.defaultWeight) > 0)
  const matrixRows: CompareRow[] = activeMetrics.map((m) => {
    const cells: CompareCell[] = ordered.map((p) => {
      const c = contributionsByProp.get(p.id)?.get(m.key)
      return { id: p.id, value: c && !c.missing ? c.normalized : null }
    })
    const present = cells.filter((c): c is { id: string; value: number } => c.value != null)
    const bestId = present.length
      ? present.reduce((a, b) => (b.value > a.value ? b : a)).id
      : null
    return { key: m.key, label: m.label, category: m.category, cells, bestId }
  })

  return { columns, rows: matrixRows }
}

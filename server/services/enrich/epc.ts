import { Buffer } from 'node:buffer'
import { TTL_DAYS } from '../../cache/ttl'
import { SQM_TO_SQFT } from '../import/helpers'
import { fetchJson } from './http'
import type { Enricher } from './types'

export type EpcRow = Record<string, string | null | undefined>

export interface EpcDerived {
  current?: string
  potential?: string
  floorAreaSqft?: number
  uprn?: string
  address?: string
  inspectionDate?: string
}

function rowAddress(row: EpcRow): string {
  if (row.address) return String(row.address)
  return [row.address1, row.address2, row.address3].filter(Boolean).join(', ')
}

function tokens(s?: string | null): string[] {
  return (s ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []
}

/**
 * Match a property's address to the best EPC certificate in the (postcode-filtered) result set.
 * Prefers a shared building number; accepts a street-only match at lower confidence. Returns null
 * when nothing matches well enough — better to show "no match" than attach the wrong certificate.
 */
export function matchEpcRow(
  rows: EpcRow[],
  displayAddress?: string | null,
): { row: EpcRow; confidence: number } | null {
  const propTokens = new Set(tokens(displayAddress))
  if (propTokens.size === 0 || rows.length === 0) return null

  let best: { row: EpcRow; shared: number; hasNumber: boolean } | null = null
  for (const row of rows) {
    let shared = 0
    let hasNumber = false
    for (const t of new Set(tokens(rowAddress(row)))) {
      if (propTokens.has(t)) {
        shared++
        if (/^\d/.test(t)) hasNumber = true
      }
    }
    if (!best || shared > best.shared) best = { row, shared, hasNumber }
  }

  if (!best || (!best.hasNumber && best.shared < 2)) return null
  const confidence = best.hasNumber ? (best.shared >= 3 ? 0.95 : 0.8) : 0.5
  return { row: best.row, confidence }
}

export function deriveEpc(row: EpcRow): EpcDerived {
  const sqm = row['total-floor-area'] != null ? parseFloat(String(row['total-floor-area'])) : NaN
  return {
    current: row['current-energy-rating'] || undefined,
    potential: row['potential-energy-rating'] || undefined,
    floorAreaSqft: Number.isFinite(sqm) && sqm > 0 ? Math.round(sqm * SQM_TO_SQFT) : undefined,
    uprn: row.uprn || undefined,
    address: rowAddress(row) || undefined,
    inspectionDate: row['inspection-date'] || undefined,
  }
}

// Read from process.env (not useRuntimeConfig) so the enricher stays usable in plain Node tests.
function epcConfig(): { email: string; key: string } | null {
  const email = process.env.NUXT_EPC_API_EMAIL
  const key = process.env.NUXT_EPC_API_KEY
  return email && key ? { email, key } : null
}

// EPC register (epc.opendatacommunities.org) — needs a free email+key; skips cleanly when absent.
export const epcEnricher: Enricher<EpcDerived> = {
  source: 'epc',
  label: 'EPC',
  ttlDays: TTL_DAYS.epc,
  cacheKey: (ctx) =>
    epcConfig() && ctx.postcode ? `${ctx.postcode}|${ctx.displayAddress ?? ''}` : null,
  async fetch(ctx) {
    const cfg = epcConfig()
    if (!cfg) return { status: 'no_match' }
    const auth = Buffer.from(`${cfg.email}:${cfg.key}`).toString('base64')
    const res = await fetchJson<{ rows?: EpcRow[] }>(
      `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(ctx.postcode!)}&size=100`,
      { headers: { Authorization: `Basic ${auth}` } },
    )
    const rows = Array.isArray(res?.rows) ? res.rows : []
    const match = matchEpcRow(rows, ctx.displayAddress)
    if (!match) return { status: 'no_match', raw: { count: rows.length } }
    return { status: 'ok', derived: deriveEpc(match.row), matchConfidence: match.confidence }
  },
}

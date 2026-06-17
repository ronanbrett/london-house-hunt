import { TTL_DAYS } from '../../cache/ttl'
import { SQM_TO_SQFT } from '../import/helpers'
import { fetchJson } from './http'
import type { Enricher } from './types'

export type EpcRow = Record<string, string | number | null | undefined>

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
  const lines = [row.addressLine1, row.address1, row.addressLine2, row.address2, row.addressLine3, row.address3]
  return lines.filter(Boolean).map(String).join(', ')
}

function tokens(s?: string | null): string[] {
  return (s ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? []
}

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
  const sqmRaw = row['total-floor-area'] ?? row.totalFloorArea
  const sqm = sqmRaw != null ? parseFloat(String(sqmRaw)) : NaN
  return {
    current: String(row['current-energy-rating'] ?? row.currentEnergyEfficiencyBand ?? '') || undefined,
    potential: String(row['potential-energy-rating'] ?? row.potentialEnergyEfficiencyBand ?? '') || undefined,
    floorAreaSqft: Number.isFinite(sqm) && sqm > 0 ? Math.round(sqm * SQM_TO_SQFT) : undefined,
    uprn: row.uprn != null ? String(row.uprn) : undefined,
    address: rowAddress(row) || undefined,
    inspectionDate: String(row['inspection-date'] ?? row.registrationDate ?? '') || undefined,
  }
}

function epcBearerToken(): string | null {
  return process.env.NUXT_EPC_API_TOKEN || null
}

interface NewApiResponse {
  data?: EpcRow[]
  pagination?: { totalRecords?: number }
}

const EPC_API_BASE = 'https://api.get-energy-performance-data.communities.gov.uk'

export const epcEnricher: Enricher<EpcDerived> = {
  source: 'epc',
  label: 'EPC',
  ttlDays: TTL_DAYS.epc,
  cacheKey: (ctx) =>
    epcBearerToken() && ctx.postcode ? `${ctx.postcode}|${ctx.displayAddress ?? ''}` : null,
  async fetch(ctx) {
    const token = epcBearerToken()
    if (!token) return { status: 'no_match' }
    const res = await fetchJson<NewApiResponse>(
      `${EPC_API_BASE}/api/domestic/search?postcode=${encodeURIComponent(ctx.postcode!)}&page_size=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const rows = Array.isArray(res?.data) ? res.data : []
    const match = matchEpcRow(rows, ctx.displayAddress)
    if (!match) return { status: 'no_match', raw: { count: rows.length } }
    return { status: 'ok', derived: deriveEpc(match.row), matchConfidence: match.confidence }
  },
}

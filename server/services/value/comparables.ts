import type { Verdict } from '#shared/types/canonical'
import { type AppDatabase, useDb } from '../../db/client'
import { comparables } from '../../db/schema'
import { type EpcRow, deriveEpc, matchEpcRow } from '../enrich/epc'
import { nearestPostcodes } from '../geo/postcode'
import { type HpiSeries, adjustToToday, fetchHpiSeries } from './hpi'
import { type PpdSale, fetchComparables } from './landRegistry'
import { summarisePrices, valueScore, verdictFromDelta } from './verdict'

export interface ValueResult {
  sampleSize: number
  fairValue: number
  fairValueLow: number
  fairValueHigh: number
  deltaPct: number | null
  verdict: Verdict | null
  valueScore: number | null
  hpiAdjusted: boolean
  sizeAdjusted: boolean
  medianPpsf: number | null
  comps: { amount: number; date: string; postcode?: string; propertyType?: string; address?: string }[]
}

/** Map a free-text listing property type to the Land Registry PPD category. */
export function mapTypeToPpd(t?: string | null): string | null {
  if (!t) return null
  const s = t.toLowerCase()
  if (s.includes('flat') || s.includes('apartment') || s.includes('maisonette')) return 'flat-maisonette'
  if (s.includes('terrace')) return 'terraced'
  if (s.includes('semi')) return 'semi-detached'
  if (s.includes('detached')) return 'detached'
  return null
}

function compAddress(sale: PpdSale): string {
  return [sale.saon, sale.paon, sale.street].filter(Boolean).join(', ')
}

interface SaleWithArea extends PpdSale {
  floorAreaSqft?: number
}

function attachFloorAreas(sales: PpdSale[], epcRows: EpcRow[]): SaleWithArea[] {
  return sales.map((sale) => {
    const addr = compAddress(sale)
    const match = matchEpcRow(epcRows, addr)
    if (!match) return sale
    const derived = deriveEpc(match.row)
    return { ...sale, floorAreaSqft: derived.floorAreaSqft }
  })
}

/** Pure: turn a set of sold-price comps into a fair-value estimate + verdict. */
export function valueFromSales(
  sales: SaleWithArea[],
  opts: {
    askingPrice?: number | null
    propertyType?: string | null
    hpiSeries?: HpiSeries | null
    floorAreaSqft?: number | null
  },
): ValueResult | null {
  if (!sales.length) return null

  const ppdType = mapTypeToPpd(opts.propertyType)
  let used = sales
  if (ppdType) {
    const sameType = sales.filter((s) => s.propertyType === ppdType)
    if (sameType.length >= 5) used = sameType
  }

  const series = opts.hpiSeries ?? null
  const adjusted = used.map((s) => (series ? adjustToToday(s.amount, s.date, series) : s.amount))

  const subjectSqft = opts.floorAreaSqft
  const withArea = used.filter((s) => s.floorAreaSqft && s.floorAreaSqft > 0)
  const canSizeAdjust = subjectSqft && subjectSqft > 0 && withArea.length >= 5

  let fairValue: number
  let iqrLow: number
  let iqrHigh: number
  let sampleSize: number
  let sizeAdjusted = false
  let medianPpsf: number | null = null

  if (canSizeAdjust) {
    const ppsfValues = withArea.map((s) => {
      const price = series ? adjustToToday(s.amount, s.date, series) : s.amount
      return price / s.floorAreaSqft!
    })
    const ppsfSummary = summarisePrices(ppsfValues)
    if (ppsfSummary) {
      medianPpsf = ppsfSummary.median
      fairValue = Math.round(ppsfSummary.median * subjectSqft)
      iqrLow = Math.round(ppsfSummary.iqrLow * subjectSqft)
      iqrHigh = Math.round(ppsfSummary.iqrHigh * subjectSqft)
      sampleSize = ppsfSummary.sampleSize
      sizeAdjusted = true
    } else {
      const summary = summarisePrices(adjusted)
      if (!summary) return null
      fairValue = summary.median
      iqrLow = summary.iqrLow
      iqrHigh = summary.iqrHigh
      sampleSize = summary.sampleSize
    }
  } else {
    const summary = summarisePrices(adjusted)
    if (!summary) return null
    fairValue = summary.median
    iqrLow = summary.iqrLow
    iqrHigh = summary.iqrHigh
    sampleSize = summary.sampleSize
  }

  let deltaPct: number | null = null
  let verdict: Verdict | null = null
  let score: number | null = null
  if (opts.askingPrice && fairValue > 0) {
    deltaPct = (opts.askingPrice - fairValue) / fairValue
    verdict = verdictFromDelta(deltaPct)
    score = valueScore(deltaPct)
  }

  return {
    sampleSize,
    fairValue,
    fairValueLow: iqrLow,
    fairValueHigh: iqrHigh,
    deltaPct,
    verdict,
    valueScore: score,
    hpiAdjusted: !!series,
    sizeAdjusted,
    medianPpsf,
    comps: used
      .slice(0, 10)
      .map((s) => ({ amount: s.amount, date: s.date, postcode: s.postcode, propertyType: s.propertyType, address: compAddress(s) })),
  }
}

interface PropertyLike {
  id: string
  postcode?: string | null
  price?: number | null
  propertyType?: string | null
  floorAreaSqft?: number | null
}

async function fetchEpcForPostcodes(postcodes: string[], token: string): Promise<EpcRow[]> {
  const all: EpcRow[] = []
  for (const pc of postcodes.slice(0, 5)) {
    try {
      const res = await fetch(
        `https://api.get-energy-performance-data.communities.gov.uk/api/domestic/search?postcode=${encodeURIComponent(pc)}&page_size=100`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        },
      )
      if (!res.ok) continue
      const json = (await res.json()) as { data?: EpcRow[] }
      if (Array.isArray(json.data)) all.push(...json.data)
    } catch {
      // non-fatal
    }
  }
  return all
}

/** Fetch comps for a property, compute the verdict, persist a comparables snapshot, return it. */
export async function computeValue(
  property: PropertyLike,
  db: AppDatabase = useDb(),
): Promise<ValueResult | null> {
  if (!property.postcode) return null
  const postcodes = await nearestPostcodes(property.postcode)
  let sales = await fetchComparables(property.postcode, { months: 24 })
  if (sales.length < 8) sales = await fetchComparables(property.postcode, { months: 36 })

  let salesWithArea: SaleWithArea[] = sales
  const epcToken = process.env.NUXT_EPC_API_TOKEN
  if (epcToken && property.floorAreaSqft) {
    const epcRows = await fetchEpcForPostcodes(postcodes, epcToken)
    if (epcRows.length > 0) {
      salesWithArea = attachFloorAreas(sales, epcRows)
    }
  }

  const result = valueFromSales(salesWithArea, {
    askingPrice: property.price,
    propertyType: property.propertyType,
    floorAreaSqft: property.floorAreaSqft,
    hpiSeries: await fetchHpiSeries(null),
  })
  if (!result) return null

  await db.insert(comparables).values({
    propertyId: property.id,
    sampleSize: result.sampleSize,
    medianPpsf: result.medianPpsf,
    fairValue: result.fairValue,
    fairValueLow: result.fairValueLow,
    fairValueHigh: result.fairValueHigh,
    iqrLow: result.fairValueLow,
    iqrHigh: result.fairValueHigh,
    deltaPct: result.deltaPct,
    verdict: result.verdict,
    compsJson: result.comps,
    hpiAdjusted: result.hpiAdjusted,
  })
  return result
}

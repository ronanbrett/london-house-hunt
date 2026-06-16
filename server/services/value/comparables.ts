import type { Verdict } from '#shared/types/canonical'
import { type AppDatabase, useDb } from '../../db/client'
import { comparables } from '../../db/schema'
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
  comps: { amount: number; date: string; postcode?: string; propertyType?: string }[]
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

/** Pure: turn a set of sold-price comps into a fair-value estimate + verdict. */
export function valueFromSales(
  sales: PpdSale[],
  opts: { askingPrice?: number | null; propertyType?: string | null; hpiSeries?: HpiSeries | null },
): ValueResult | null {
  if (!sales.length) return null

  // Prefer same-type comps when there are enough of them.
  const ppdType = mapTypeToPpd(opts.propertyType)
  let used = sales
  if (ppdType) {
    const sameType = sales.filter((s) => s.propertyType === ppdType)
    if (sameType.length >= 5) used = sameType
  }

  const series = opts.hpiSeries ?? null
  const adjusted = used.map((s) => (series ? adjustToToday(s.amount, s.date, series) : s.amount))
  const summary = summarisePrices(adjusted)
  if (!summary) return null

  const fairValue = summary.median
  let deltaPct: number | null = null
  let verdict: Verdict | null = null
  let score: number | null = null
  if (opts.askingPrice && fairValue > 0) {
    deltaPct = (opts.askingPrice - fairValue) / fairValue
    verdict = verdictFromDelta(deltaPct)
    score = valueScore(deltaPct)
  }

  return {
    sampleSize: summary.sampleSize,
    fairValue,
    fairValueLow: summary.iqrLow,
    fairValueHigh: summary.iqrHigh,
    deltaPct,
    verdict,
    valueScore: score,
    hpiAdjusted: !!series,
    comps: used
      .slice(0, 10)
      .map((s) => ({ amount: s.amount, date: s.date, postcode: s.postcode, propertyType: s.propertyType })),
  }
}

interface PropertyLike {
  id: string
  postcode?: string | null
  price?: number | null
  propertyType?: string | null
}

/** Fetch comps for a property, compute the verdict, persist a comparables snapshot, return it. */
export async function computeValue(
  property: PropertyLike,
  db: AppDatabase = useDb(),
): Promise<ValueResult | null> {
  if (!property.postcode) return null
  let sales = await fetchComparables(property.postcode, { months: 24 })
  if (sales.length < 8) sales = await fetchComparables(property.postcode, { months: 36 })

  const result = valueFromSales(sales, {
    askingPrice: property.price,
    propertyType: property.propertyType,
    hpiSeries: await fetchHpiSeries(null),
  })
  if (!result) return null

  await db.insert(comparables).values({
    propertyId: property.id,
    sampleSize: result.sampleSize,
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

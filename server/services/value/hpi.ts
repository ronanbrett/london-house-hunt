export type HpiSeries = Record<string, number> // 'YYYY-MM' -> index value

function monthDiff(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number)
  const [by, bm] = b.split('-').map(Number)
  return Math.abs((ay! - by!) * 12 + (am! - bm!))
}

function indexForMonth(series: HpiSeries, month: string): number | undefined {
  if (series[month]) return series[month]
  let best: string | undefined
  let bestDiff = Infinity
  for (const key of Object.keys(series)) {
    const diff = monthDiff(key, month)
    if (diff < bestDiff) {
      bestDiff = diff
      best = key
    }
  }
  return best ? series[best] : undefined
}

/** Index a past sale to today's money: amount * (latestIndex / saleMonthIndex). Identity if no series. */
export function adjustToToday(amount: number, saleDateISO: string, series: HpiSeries | null): number {
  if (!series) return amount
  const months = Object.keys(series).sort()
  if (!months.length) return amount
  const nowIdx = series[months[months.length - 1]!]
  const saleIdx = indexForMonth(series, saleDateISO.slice(0, 7))
  if (!nowIdx || !saleIdx) return amount
  return Math.round(amount * (nowIdx / saleIdx))
}

/**
 * Local-authority HPI series. DEFERRED: wiring the UK HPI source (region-URI mapping) is a
 * follow-up; until then this returns null and the value engine simply skips time-adjustment
 * (small effect over the ≤36-month comp window). `adjustToToday` is ready for when it lands.
 */
export async function fetchHpiSeries(_localAuthority?: string | null): Promise<HpiSeries | null> {
  return null
}

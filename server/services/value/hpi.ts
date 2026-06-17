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

const ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query'

const HPI_QUERY = `PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
SELECT ?date ?index WHERE {
  ?obs ukhpi:refRegion <http://landregistry.data.gov.uk/id/region/london> ;
       ukhpi:refPeriodStart ?date ;
       ukhpi:housePriceIndex ?index .
}
ORDER BY ?date`

let hpiCache: { series: HpiSeries; fetchedAt: number } | null = null
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function fetchHpiSeries(_localAuthority?: string | null): Promise<HpiSeries | null> {
  if (hpiCache && Date.now() - hpiCache.fetchedAt < CACHE_TTL_MS) {
    return hpiCache.series
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json',
      },
      body: new URLSearchParams({ query: HPI_QUERY }).toString(),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const json = (await res.json()) as { results?: { bindings?: any[] } }
    const bindings = json?.results?.bindings
    if (!Array.isArray(bindings) || !bindings.length) return null

    const series: HpiSeries = {}
    for (const b of bindings) {
      const date = b?.date?.value
      const index = Number(b?.index?.value)
      if (date && Number.isFinite(index)) {
        series[String(date).slice(0, 7)] = index
      }
    }
    if (Object.keys(series).length === 0) return null

    hpiCache = { series, fetchedAt: Date.now() }
    return series
  } catch {
    return null
  }
}

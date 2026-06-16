import { nearestPostcodes } from '../geo/postcode'

export interface PpdSale {
  amount: number // integer pounds
  date: string // ISO yyyy-mm-dd
  postcode?: string
  paon?: string
  saon?: string
  street?: string
  propertyType?: string // terraced | semi-detached | detached | flat-maisonette | other
  estateType?: string // freehold | leasehold
}

const ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query'

function lastSegment(uri?: string): string | undefined {
  if (!uri) return undefined
  const seg = uri.split(/[/#]/).pop()
  return seg ? seg.toLowerCase() : undefined
}

/** SPARQL for HM Land Registry Price Paid sales at a set of exact postcodes since a date. */
export function buildPpdQuery(postcodes: string[], sinceISO: string): string {
  const values = postcodes.map((p) => `"${p}"^^xsd:string`).join(' ')
  return `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?amount ?date ?postcode ?paon ?saon ?street ?propertyType ?estateType WHERE {
  VALUES ?postcode { ${values} }
  ?addr lrcommon:postcode ?postcode .
  ?transx lrppi:propertyAddress ?addr ;
          lrppi:pricePaid ?amount ;
          lrppi:transactionDate ?date .
  OPTIONAL { ?addr lrcommon:paon ?paon }
  OPTIONAL { ?addr lrcommon:saon ?saon }
  OPTIONAL { ?addr lrcommon:street ?street }
  OPTIONAL { ?transx lrppi:propertyType ?propertyType }
  OPTIONAL { ?transx lrppi:estateType ?estateType }
  FILTER(?date >= "${sinceISO}"^^xsd:date)
}
ORDER BY DESC(?date)`
}

export function parsePpdResults(json: unknown): PpdSale[] {
  const bindings = (json as { results?: { bindings?: any[] } })?.results?.bindings
  if (!Array.isArray(bindings)) return []
  const sales: PpdSale[] = []
  for (const b of bindings) {
    const amount = Number(b?.amount?.value)
    const date = b?.date?.value
    if (!Number.isFinite(amount) || !date) continue
    sales.push({
      amount: Math.round(amount),
      date: String(date).slice(0, 10),
      postcode: b?.postcode?.value,
      paon: b?.paon?.value,
      saon: b?.saon?.value,
      street: b?.street?.value,
      propertyType: lastSegment(b?.propertyType?.value),
      estateType: lastSegment(b?.estateType?.value),
    })
  }
  return sales
}

export async function fetchSales(postcodes: string[], sinceISO: string): Promise<PpdSale[]> {
  if (!postcodes.length) return []
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
    },
    body: new URLSearchParams({ query: buildPpdQuery(postcodes, sinceISO) }).toString(),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Land Registry query failed: ${res.status}`)
  return parsePpdResults(await res.json())
}

function isoMonthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

/** Recent sold-price comparables near a postcode (widened via nearby postcodes). */
export async function fetchComparables(
  postcode: string,
  opts: { months?: number } = {},
): Promise<PpdSale[]> {
  const postcodes = await nearestPostcodes(postcode)
  if (!postcodes.length) return []
  return fetchSales(postcodes, isoMonthsAgo(opts.months ?? 24))
}

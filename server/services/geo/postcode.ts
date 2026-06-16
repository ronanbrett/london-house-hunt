/** Normalise a UK postcode to "OUTCODE INCODE" (e.g. "sw112ab" -> "SW11 2AB"). */
export function normalizePostcode(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.length < 5 || s.length > 7) return undefined
  return `${s.slice(0, -3)} ${s.slice(-3)}`
}

/** Derive the postcode district ("SW11") and sector ("SW11 2") from a postcode. */
export function derivePostcodeParts(postcode?: string | null): {
  district?: string
  sector?: string
} {
  const norm = normalizePostcode(postcode)
  if (!norm) return {}
  const [outcode, incode] = norm.split(' ')
  return {
    district: outcode,
    sector: incode ? `${outcode} ${incode[0]}` : undefined,
  }
}

export interface PostcodeGeo {
  lat?: number
  lng?: number
  lsoaCode?: string
  msoaCode?: string
  adminDistrict?: string
  ward?: string
}

/** Look up a postcode via postcodes.io (free, keyless). Returns null on miss/error. */
export async function lookupPostcode(postcode?: string | null): Promise<PostcodeGeo | null> {
  const norm = normalizePostcode(postcode)
  if (!norm) return null
  try {
    const res = await $fetch<{ result?: any }>(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(norm)}`,
    )
    const r = res?.result
    if (!r) return null
    return {
      lat: r.latitude ?? undefined,
      lng: r.longitude ?? undefined,
      lsoaCode: r.codes?.lsoa ?? undefined,
      msoaCode: r.codes?.msoa ?? undefined,
      adminDistrict: r.admin_district ?? undefined,
      ward: r.admin_ward ?? undefined,
    }
  } catch {
    return null
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  derivePostcodeParts,
  lookupPostcode,
  normalizePostcode,
} from '../../../server/services/geo/postcode'

afterEach(() => vi.restoreAllMocks())

describe('normalizePostcode', () => {
  it('inserts the canonical space', () => {
    expect(normalizePostcode('sw112ab')).toBe('SW11 2AB')
    expect(normalizePostcode('SW11 2AB')).toBe('SW11 2AB')
    expect(normalizePostcode('m1 1aa')).toBe('M1 1AA')
  })
  it('rejects clearly invalid input', () => {
    expect(normalizePostcode('XYZ')).toBeUndefined()
    expect(normalizePostcode('')).toBeUndefined()
    expect(normalizePostcode(null)).toBeUndefined()
  })
})

describe('derivePostcodeParts', () => {
  it('derives district and sector', () => {
    expect(derivePostcodeParts('SW11 2AB')).toEqual({ district: 'SW11', sector: 'SW11 2' })
    expect(derivePostcodeParts('m11aa')).toEqual({ district: 'M1', sector: 'M1 1' })
  })
  it('returns empty for invalid input', () => {
    expect(derivePostcodeParts('nope')).toEqual({})
  })
})

describe('lookupPostcode', () => {
  it('maps a postcodes.io result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              result: {
                latitude: 51.4,
                longitude: -0.1,
                admin_district: 'Wandsworth',
                admin_ward: 'Northcote',
                codes: { lsoa: 'E01', msoa: 'E02' },
              },
            }),
            { status: 200 },
          ),
      ),
    )
    const geo = await lookupPostcode('SW11 2AB')
    expect(geo).toMatchObject({ lat: 51.4, lng: -0.1, adminDistrict: 'Wandsworth', lsoaCode: 'E01' })
  })

  it('returns null for an invalid postcode without calling the network', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    expect(await lookupPostcode('nope')).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
})

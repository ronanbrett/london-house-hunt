import { describe, expect, it } from 'vitest'
import { buildPpdQuery, parsePpdResults } from '../../../server/services/value/landRegistry'

describe('buildPpdQuery', () => {
  it('includes the postcodes and date filter', () => {
    const q = buildPpdQuery(['SW11 2AB', 'SW11 2QP'], '2024-06-16')
    expect(q).toContain('"SW11 2AB"^^xsd:string')
    expect(q).toContain('"SW11 2QP"^^xsd:string')
    expect(q).toContain('"2024-06-16"^^xsd:date')
    expect(q).toContain('lrppi:pricePaid ?amount')
  })
})

describe('parsePpdResults', () => {
  it('maps SPARQL bindings to sales and derives type/estate from URIs', () => {
    const json = {
      results: {
        bindings: [
          {
            amount: { value: '750000' },
            date: { value: '2025-03-01' },
            postcode: { value: 'SW11 2AB' },
            paon: { value: '42' },
            street: { value: 'Test Road' },
            propertyType: { value: 'http://landregistry.data.gov.uk/def/common/terraced' },
            estateType: { value: 'http://landregistry.data.gov.uk/def/common/freehold' },
          },
          { amount: { value: 'not-a-number' }, date: { value: 'x' } }, // skipped
        ],
      },
    }
    const sales = parsePpdResults(json)
    expect(sales).toHaveLength(1)
    expect(sales[0]).toMatchObject({
      amount: 750000,
      date: '2025-03-01',
      postcode: 'SW11 2AB',
      paon: '42',
      street: 'Test Road',
      propertyType: 'terraced',
      estateType: 'freehold',
    })
  })

  it('returns empty for malformed input', () => {
    expect(parsePpdResults(null)).toEqual([])
    expect(parsePpdResults({})).toEqual([])
  })
})

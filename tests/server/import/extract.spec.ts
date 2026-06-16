import { describe, expect, it } from 'vitest'
import {
  devalueUnflatten,
  extractAssignedObject,
  extractJsonLd,
  extractNextData,
  extractZooplaTargeting,
} from '../../../server/services/import/extract'

describe('devalueUnflatten', () => {
  it('decodes a devalue-encoded object', () => {
    const flat = [
      { name: 1, nested: 2 },
      'hello',
      { value: 3 },
      42,
    ]
    const encoded = { data: JSON.stringify(flat), encoding: 'on' }
    const result = devalueUnflatten(encoded) as any
    expect(result.name).toBe('hello')
    expect(result.nested.value).toBe(42)
  })

  it('decodes arrays with references', () => {
    const flat = [
      { items: 1 },
      [2, 3],
      'a',
      'b',
    ]
    const encoded = { data: JSON.stringify(flat), encoding: 'on' }
    const result = devalueUnflatten(encoded) as any
    expect(result.items).toEqual(['a', 'b'])
  })

  it('handles booleans and null', () => {
    const flat = [
      { flag: 1, empty: 2 },
      true,
      null,
    ]
    const encoded = { data: JSON.stringify(flat), encoding: 'on' }
    const result = devalueUnflatten(encoded) as any
    expect(result.flag).toBe(true)
    expect(result.empty).toBe(null)
  })

  it('returns null for non-encoded input', () => {
    expect(devalueUnflatten({ propertyData: {} })).toBeNull()
    expect(devalueUnflatten(null)).toBeNull()
    expect(devalueUnflatten('string')).toBeNull()
  })

  it('returns null for malformed data', () => {
    expect(devalueUnflatten({ data: 'not-json', encoding: 'on' })).toBeNull()
    expect(devalueUnflatten({ data: '[]', encoding: 'on' })).toBeNull()
  })
})

describe('extractZooplaTargeting', () => {
  it('extracts targeting data from __ZAD_TARGETING__ script', () => {
    const html = '<html><body><script id="__ZAD_TARGETING__" type="application/json">{"listing_id":"123","price":"500000"}</script></body></html>'
    const result = extractZooplaTargeting(html)
    expect(result).toEqual({ listing_id: '123', price: '500000' })
  })

  it('returns null when tag is missing', () => {
    expect(extractZooplaTargeting('<html><body>no data</body></html>')).toBeNull()
  })
})

describe('extractJsonLd', () => {
  it('extracts JSON-LD by @type', () => {
    const ld = { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: 'Test' }
    const html = `<html><body><script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`
    const result = extractJsonLd(html, 'RealEstateListing')
    expect(result?.name).toBe('Test')
  })

  it('skips non-matching types', () => {
    const ld = { '@type': 'BreadcrumbList' }
    const html = `<html><body><script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`
    expect(extractJsonLd(html, 'RealEstateListing')).toBeNull()
  })

  it('finds the right one among multiple ld+json blocks', () => {
    const breadcrumb = { '@type': 'BreadcrumbList' }
    const listing = { '@type': 'RealEstateListing', name: 'Found' }
    const html = `<html><body>
      <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
      <script type="application/ld+json">${JSON.stringify(listing)}</script>
    </body></html>`
    expect(extractJsonLd(html, 'RealEstateListing')?.name).toBe('Found')
  })
})

describe('extractAssignedObject', () => {
  it('extracts PAGE_MODEL', () => {
    const html = 'window.PAGE_MODEL = {"foo":"bar"};'
    expect(extractAssignedObject(html, 'PAGE_MODEL')).toBe('{"foo":"bar"}')
  })
})

describe('extractNextData', () => {
  it('extracts __NEXT_DATA__', () => {
    const html = '<script id="__NEXT_DATA__" type="application/json">{"page":"/test"}</script>'
    const result = extractNextData(html) as any
    expect(result.page).toBe('/test')
  })

  it('returns null when missing', () => {
    expect(extractNextData('<html></html>')).toBeNull()
  })
})

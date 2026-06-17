import { describe, expect, it } from 'vitest'
import { mapTypeToPpd, valueFromSales } from '../../../server/services/value/comparables'

const flats = [
  { amount: 500000, date: '2025-01-01', propertyType: 'flat-maisonette' },
  { amount: 510000, date: '2025-02-01', propertyType: 'flat-maisonette' },
  { amount: 520000, date: '2025-03-01', propertyType: 'flat-maisonette' },
  { amount: 530000, date: '2025-04-01', propertyType: 'flat-maisonette' },
  { amount: 540000, date: '2025-05-01', propertyType: 'flat-maisonette' },
  { amount: 550000, date: '2025-06-01', propertyType: 'flat-maisonette' },
]
const others = [
  { amount: 1200000, date: '2025-01-01', propertyType: 'detached' },
  { amount: 1300000, date: '2025-02-01', propertyType: 'detached' },
]

describe('mapTypeToPpd', () => {
  it('maps listing types to PPD categories', () => {
    expect(mapTypeToPpd('Flat')).toBe('flat-maisonette')
    expect(mapTypeToPpd('2 bed apartment')).toBe('flat-maisonette')
    expect(mapTypeToPpd('Semi-Detached House')).toBe('semi-detached')
    expect(mapTypeToPpd('Terraced')).toBe('terraced')
    expect(mapTypeToPpd('Detached')).toBe('detached')
    expect(mapTypeToPpd('something else')).toBeNull()
  })
})

describe('valueFromSales', () => {
  it('filters to the same property type and bands the verdict', () => {
    const r = valueFromSales([...flats, ...others], { askingPrice: 600000, propertyType: 'Flat' })
    expect(r).not.toBeNull()
    expect(r!.sampleSize).toBe(6) // detached excluded
    expect(r!.fairValue).toBe(525000) // median of 500k..550k
    expect(r!.verdict).toBe('overpriced') // (600-525)/525 = +14%
    expect(r!.valueScore).toBeLessThan(40)
    expect(r!.hpiAdjusted).toBe(false)
    expect(r!.sizeAdjusted).toBe(false)
  })
  it('works without an asking price (no verdict)', () => {
    const r = valueFromSales(flats, {})
    expect(r!.fairValue).toBe(525000)
    expect(r!.deltaPct).toBeNull()
    expect(r!.verdict).toBeNull()
  })
  it('returns null with no sales', () => {
    expect(valueFromSales([], {})).toBeNull()
  })
  it('size-adjusts when subject and comps have floor areas', () => {
    const salesWithArea = [
      { amount: 500000, date: '2025-01-01', propertyType: 'flat-maisonette', floorAreaSqft: 500 },
      { amount: 600000, date: '2025-02-01', propertyType: 'flat-maisonette', floorAreaSqft: 600 },
      { amount: 550000, date: '2025-03-01', propertyType: 'flat-maisonette', floorAreaSqft: 550 },
      { amount: 520000, date: '2025-04-01', propertyType: 'flat-maisonette', floorAreaSqft: 520 },
      { amount: 580000, date: '2025-05-01', propertyType: 'flat-maisonette', floorAreaSqft: 580 },
    ]
    const r = valueFromSales(salesWithArea, { askingPrice: 700000, floorAreaSqft: 700 })
    expect(r).not.toBeNull()
    expect(r!.sizeAdjusted).toBe(true)
    expect(r!.medianPpsf).toBeGreaterThan(0)
    expect(r!.fairValue).toBe(Math.round(r!.medianPpsf! * 700))
  })
  it('falls back to whole price when not enough comps have area', () => {
    const salesFewArea = [
      { amount: 500000, date: '2025-01-01', floorAreaSqft: 500 },
      { amount: 510000, date: '2025-02-01' },
      { amount: 520000, date: '2025-03-01' },
      { amount: 530000, date: '2025-04-01' },
      { amount: 540000, date: '2025-05-01' },
    ]
    const r = valueFromSales(salesFewArea, { floorAreaSqft: 600 })
    expect(r).not.toBeNull()
    expect(r!.sizeAdjusted).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { adjustToToday } from '../../../server/services/value/hpi'

const series = { '2024-01': 100, '2025-01': 110 }

describe('adjustToToday', () => {
  it('indexes a sale to the latest month', () => {
    expect(adjustToToday(100000, '2024-01-15', series)).toBe(110000)
  })
  it('uses the nearest available month when exact is missing', () => {
    expect(adjustToToday(100000, '2024-06-15', series)).toBe(110000) // nearest = 2024-01
  })
  it('is identity when no series', () => {
    expect(adjustToToday(100000, '2024-01-01', null)).toBe(100000)
  })
})

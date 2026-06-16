import { describe, expect, it } from 'vitest'
import { computeYield, investmentScore } from '../../../server/services/yield/estimate'

describe('computeYield', () => {
  it('computes gross and net yield with carrying costs', () => {
    const r = computeYield({ price: 500000, monthlyRent: 2000 })
    expect(r.annualRent).toBe(24000)
    expect(r.grossYield).toBe(4.8) // 24000 / 500000
    // net: 24000 - voids 1200 - maintenance 5000 - 0 - 0 = 17800 -> 3.6%
    expect(r.netOperatingIncome).toBe(17800)
    expect(r.netYield).toBe(3.6)
  })

  it('subtracts service charge, ground rent and management', () => {
    const r = computeYield({
      price: 500000,
      monthlyRent: 2000,
      serviceChargeAnnual: 1800,
      groundRentAnnual: 250,
      managed: true,
    })
    // 24000 - voids1200 - mgmt2400 - maint5000 - sc1800 - gr250 = 13350
    expect(r.costs.management).toBe(2400)
    expect(r.netOperatingIncome).toBe(13350)
    expect(r.netYield).toBe(2.7)
  })
})

describe('investmentScore', () => {
  it('maps net yield % to 0-100', () => {
    expect(investmentScore(1)).toBe(0)
    expect(investmentScore(8)).toBe(100)
    expect(investmentScore(4.5)).toBe(50)
    expect(investmentScore(0.5)).toBe(0) // clamped
  })
})

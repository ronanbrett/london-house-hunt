export interface YieldInputs {
  price: number
  monthlyRent: number
  serviceChargeAnnual?: number | null
  groundRentAnnual?: number | null
  managed?: boolean // 10% letting-agent management fee
  voidRate?: number // default 5% (≈2.5 weeks empty/yr)
  maintenanceRate?: number // default 1% of value/yr
}

export interface YieldResult {
  annualRent: number
  grossYield: number // %
  netYield: number // %
  netOperatingIncome: number
  costs: {
    voids: number
    management: number
    maintenance: number
    serviceCharge: number
    groundRent: number
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Gross + net rental yield from rent, price and the (leasehold) carrying costs. */
export function computeYield(i: YieldInputs): YieldResult {
  const annualRent = Math.round(i.monthlyRent * 12)
  const voids = Math.round(annualRent * (i.voidRate ?? 0.05))
  const management = i.managed ? Math.round(annualRent * 0.1) : 0
  const maintenance = Math.round(i.price * (i.maintenanceRate ?? 0.01))
  const serviceCharge = i.serviceChargeAnnual ?? 0
  const groundRent = i.groundRentAnnual ?? 0
  const netOperatingIncome = annualRent - voids - management - maintenance - serviceCharge - groundRent

  return {
    annualRent,
    grossYield: i.price > 0 ? round1((annualRent / i.price) * 100) : 0,
    netYield: i.price > 0 ? round1((netOperatingIncome / i.price) * 100) : 0,
    netOperatingIncome,
    costs: { voids, management, maintenance, serviceCharge, groundRent },
  }
}

/** Net yield % → 0–100 (≈0 at 1%, 100 at 8%+). London tilts low, so this rewards higher yields. */
export function investmentScore(netYieldPct: number): number {
  return Math.max(0, Math.min(100, Math.round(((netYieldPct - 1) / 7) * 100)))
}

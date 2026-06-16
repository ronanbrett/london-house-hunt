import { valueScore } from '../value/verdict'
import { type Band, leaseholdScore, linearScore, mappedScore, thresholdScore } from './normalize'

/** Flat inputs the metrics read (assembled in inputs.ts from property + enrichment + comparables). */
export interface MetricInput {
  price?: number | null
  beds?: number | null
  floorAreaSqft?: number | null
  tenure?: string | null
  leaseYearsRemaining?: number | null
  epcCurrent?: string | null
  nearestStationMiles?: number | null
  commuteMinutes?: number | null
  crimeTotal?: number | null
  floodAreaCount?: number | null
  valueDeltaPct?: number | null
}

export type MissingPolicy = 'exclude' | 'neutral' | 'penalize'

export interface MetricDef {
  key: string
  label: string
  category: string
  defaultWeight: number // 0..10, the "Home to live in" weighting
  missingPolicy: MissingPolicy
  /** 0..100, or null when the input is missing. */
  score: (i: MetricInput) => number | null
}

const EPC_TABLE: Record<string, number> = { A: 100, B: 85, C: 70, D: 50, E: 30, F: 15, G: 0 }
const CRIME_BANDS: Band[] = [
  { upTo: 50, score: 100 },
  { upTo: 150, score: 75 },
  { upTo: 300, score: 50 },
  { upTo: 600, score: 25 },
]
const FLOOD_BANDS: Band[] = [
  { upTo: 0, score: 100 },
  { upTo: 2, score: 60 },
  { upTo: 5, score: 30 },
]

export const METRICS: MetricDef[] = [
  {
    key: 'value',
    label: 'Value for money',
    category: 'value',
    defaultWeight: 8,
    missingPolicy: 'exclude',
    score: (i) => (i.valueDeltaPct == null ? null : valueScore(i.valueDeltaPct)),
  },
  {
    key: 'commute',
    label: 'Commute',
    category: 'commute',
    defaultWeight: 7,
    missingPolicy: 'exclude',
    score: (i) => (i.commuteMinutes == null ? null : linearScore(i.commuteMinutes, 15, 75)),
  },
  {
    key: 'station',
    label: 'Station proximity',
    category: 'location',
    defaultWeight: 6,
    missingPolicy: 'exclude',
    score: (i) => (i.nearestStationMiles == null ? null : linearScore(i.nearestStationMiles, 0.1, 1.0)),
  },
  {
    key: 'crime',
    label: 'Safety',
    category: 'safety',
    defaultWeight: 6,
    missingPolicy: 'exclude',
    score: (i) => (i.crimeTotal == null ? null : thresholdScore(i.crimeTotal, CRIME_BANDS)),
  },
  {
    key: 'flood',
    label: 'Flood risk',
    category: 'environment',
    defaultWeight: 4,
    missingPolicy: 'exclude',
    score: (i) => (i.floodAreaCount == null ? null : thresholdScore(i.floodAreaCount, FLOOD_BANDS)),
  },
  {
    key: 'epc',
    label: 'Energy (EPC)',
    category: 'energy',
    defaultWeight: 4,
    missingPolicy: 'neutral',
    score: (i) => (i.epcCurrent == null ? null : mappedScore(i.epcCurrent, EPC_TABLE)),
  },
  {
    key: 'tenure',
    label: 'Tenure',
    category: 'tenure',
    defaultWeight: 5,
    missingPolicy: 'exclude',
    score: (i) => leaseholdScore(i.tenure, i.leaseYearsRemaining),
  },
  {
    key: 'size',
    label: 'Size',
    category: 'size',
    defaultWeight: 6,
    missingPolicy: 'exclude',
    score: (i) => (i.floorAreaSqft == null ? null : linearScore(i.floorAreaSqft, 1200, 400)),
  },
]

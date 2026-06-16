import { z } from 'zod'

// The single canonical shape every import path (server-fetch, bookmarklet, manual) maps into,
// and the shape the UI reads. Keep portal-specific quirks OUT of here.
//
// Note: URLs are validated as plain strings (not z.url()) because portals serve protocol-relative
// and query-laden image URLs that strict URL parsing would wrongly reject.

export const PropertySourceSchema = z.enum(['rightmove', 'zoopla', 'manual'])
export type PropertySource = z.infer<typeof PropertySourceSchema>

export const TenureSchema = z.enum(['freehold', 'leasehold', 'share_of_freehold', 'unknown'])
export type Tenure = z.infer<typeof TenureSchema>

export const MediaSchema = z.object({
  kind: z.enum(['photo', 'floorplan']),
  url: z.string(),
  caption: z.string().optional(),
})
export type Media = z.infer<typeof MediaSchema>

export const StationSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  distanceMiles: z.number().optional(),
})
export type Station = z.infer<typeof StationSchema>

export const CanonicalListingSchema = z.object({
  source: PropertySourceSchema,
  sourceUrl: z.string().optional(),
  sourceId: z.string().optional(),

  displayAddress: z.string().optional(),
  postcode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),

  price: z.number().int().nonnegative().optional(), // integer pounds
  priceQualifier: z.string().optional(),
  propertyType: z.string().optional(),
  tenure: TenureSchema.optional(),
  leaseYearsRemaining: z.number().int().optional(),
  serviceChargeAnnual: z.number().int().optional(),
  groundRentAnnual: z.number().int().optional(),

  beds: z.number().int().optional(),
  baths: z.number().int().optional(),
  receptions: z.number().int().optional(),
  floorAreaSqft: z.number().optional(),

  epcCurrent: z.string().optional(),
  epcPotential: z.string().optional(),
  councilTaxBand: z.string().optional(),

  description: z.string().optional(),
  agentName: z.string().optional(),
  firstListedAt: z.number().int().optional(), // epoch ms

  photos: z.array(MediaSchema).default([]),
  floorplans: z.array(MediaSchema).default([]),
  stations: z.array(StationSchema).default([]),
})
export type CanonicalListing = z.infer<typeof CanonicalListingSchema>

// ---- Enrichment ----

export const EnrichmentSourceSchema = z.enum([
  'postcode',
  'police',
  'flood',
  'epc',
  'land_registry',
  'tfl',
  'schools',
  'ons',
  'council_tax',
  'broadband',
])
export type EnrichmentSource = z.infer<typeof EnrichmentSourceSchema>

export type EnrichmentStatus = 'fresh' | 'cached' | 'stale-error' | 'error' | 'no_match'

// ---- Scoring ----

export const ScoreContributionSchema = z.object({
  metricKey: z.string(),
  label: z.string(),
  category: z.string(),
  raw: z.union([z.number(), z.string(), z.null()]),
  normalized: z.number(), // 0..100
  weight: z.number(), // effective weight used
})
export type ScoreContribution = z.infer<typeof ScoreContributionSchema>

export const ScoreSchema = z.object({
  total: z.number(), // 0..100
  confidence: z.number(), // 0..1
  contributions: z.array(ScoreContributionSchema),
})
export type Score = z.infer<typeof ScoreSchema>

export const VERDICTS = [
  'underpriced',
  'slightly_below',
  'fair',
  'slightly_above',
  'overpriced',
] as const
export type Verdict = (typeof VERDICTS)[number]

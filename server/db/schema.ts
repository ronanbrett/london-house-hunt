import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

// Conventions:
// - ids are uuid text, generated app-side
// - timestamps are epoch milliseconds (integer)
// - all money is integer POUNDS (never pence, never mixed)

const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const now = () => Date.now()

export const properties = sqliteTable('properties', {
  id: uuid(),
  source: text('source', { enum: ['rightmove', 'zoopla', 'manual'] }).notNull(),
  sourceUrl: text('source_url'),
  sourceId: text('source_id'),
  rawPayload: text('raw_payload', { mode: 'json' }), // raw scraped model, for re-parse
  status: text('status', {
    enum: ['active', 'shortlisted', 'viewed', 'rejected', 'offered', 'archived', 'sold'],
  })
    .notNull()
    .default('active'),

  // canonical listing fields
  displayAddress: text('display_address'),
  postcode: text('postcode'),
  postcodeSector: text('postcode_sector'), // e.g. "SW11 2"
  postcodeDistrict: text('postcode_district'), // e.g. "SW11"
  lat: real('lat'),
  lng: real('lng'),
  uprn: text('uprn'), // captured from EPC match; durable join key

  price: integer('price'), // integer pounds
  priceQualifier: text('price_qualifier'),
  propertyType: text('property_type'),
  tenure: text('tenure', { enum: ['freehold', 'leasehold', 'share_of_freehold', 'unknown'] }),
  leaseYearsRemaining: integer('lease_years_remaining'),
  serviceChargeAnnual: integer('service_charge_annual'), // pounds/yr
  groundRentAnnual: integer('ground_rent_annual'), // pounds/yr

  beds: integer('beds'),
  baths: integer('baths'),
  receptions: integer('receptions'),
  floorAreaSqft: real('floor_area_sqft'),

  epcCurrent: text('epc_current'),
  epcPotential: text('epc_potential'),
  councilTaxBand: text('council_tax_band'),

  description: text('description'),
  agentName: text('agent_name'),
  firstListedAt: integer('first_listed_at'), // epoch ms — for time-on-market

  createdAt: integer('created_at').notNull().$defaultFn(now),
  updatedAt: integer('updated_at').notNull().$defaultFn(now),
})

export const propertyMedia = sqliteTable('property_media', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['photo', 'floorplan'] }).notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const nearestStations = sqliteTable('nearest_stations', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type'), // tube | rail | dlr | overground | tram | ...
  distanceMiles: real('distance_miles'),
})

// Append-only enrichment cache. Never overwrite — keep history so drift is visible.
export const enrichmentSnapshots = sqliteTable(
  'enrichment_snapshots',
  {
    id: uuid(),
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    source: text('source').notNull(), // postcode|police|flood|epc|land_registry|tfl|schools|ons|council_tax|broadband
    cacheKey: text('cache_key'), // lsoa code, postcode, destination id, etc.
    status: text('status', { enum: ['ok', 'error', 'no_match'] }).notNull(),
    matchConfidence: real('match_confidence'),
    rawJson: text('raw_json', { mode: 'json' }),
    derivedJson: text('derived_json', { mode: 'json' }),
    fetchedAt: integer('fetched_at').notNull().$defaultFn(now),
    ttlDays: integer('ttl_days'),
  },
  (t) => [index('enr_prop_source_fetched_idx').on(t.propertyId, t.source, t.fetchedAt)],
)

export const destinations = sqliteTable('destinations', {
  id: uuid(),
  label: text('label').notNull(),
  lat: real('lat'),
  lng: real('lng'),
  mode: text('mode', { enum: ['transit', 'cycling', 'walking', 'driving'] })
    .notNull()
    .default('transit'),
  importance: integer('importance').notNull().default(3), // 1..5
  createdAt: integer('created_at').notNull().$defaultFn(now),
})

export const commuteResults = sqliteTable('commute_results', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  destinationId: text('destination_id')
    .notNull()
    .references(() => destinations.id, { onDelete: 'cascade' }),
  minutes: integer('minutes'),
  changes: integer('changes'),
  legsJson: text('legs_json', { mode: 'json' }),
  fetchedAt: integer('fetched_at').notNull().$defaultFn(now),
})

export const profiles = sqliteTable('profiles', {
  id: uuid(),
  name: text('name').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  scoringMode: text('scoring_mode', { enum: ['absolute', 'relative'] })
    .notNull()
    .default('absolute'),
  createdAt: integer('created_at').notNull().$defaultFn(now),
  updatedAt: integer('updated_at').notNull().$defaultFn(now),
})

export const profileWeights = sqliteTable(
  'profile_weights',
  {
    id: uuid(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    metricKey: text('metric_key').notNull(),
    weight: real('weight').notNull().default(5), // 0..10 slider
  },
  (t) => [unique('profile_metric_uq').on(t.profileId, t.metricKey)],
)

export const comparables = sqliteTable('comparables', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  geoLevel: text('geo_level', { enum: ['postcode', 'sector', 'district'] }),
  sampleSize: integer('sample_size'),
  medianPpsf: real('median_ppsf'),
  iqrLow: real('iqr_low'),
  iqrHigh: real('iqr_high'),
  fairValue: integer('fair_value'),
  fairValueLow: integer('fair_value_low'),
  fairValueHigh: integer('fair_value_high'),
  deltaPct: real('delta_pct'),
  verdict: text('verdict'),
  compsJson: text('comps_json', { mode: 'json' }),
  hpiAdjusted: integer('hpi_adjusted', { mode: 'boolean' }).default(false),
  computedAt: integer('computed_at').notNull().$defaultFn(now),
})

export const rentEstimates = sqliteTable('rent_estimates', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  monthlyRent: integer('monthly_rent'), // pounds/month
  source: text('source', { enum: ['voa', 'lha', 'listings', 'user'] }).notNull(),
  low: integer('low'),
  high: integer('high'),
  computedAt: integer('computed_at').notNull().$defaultFn(now),
})

export const scores = sqliteTable('scores', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  mode: text('mode', { enum: ['absolute', 'relative'] }).notNull(),
  total: real('total'),
  confidence: real('confidence'),
  contributionsJson: text('contributions_json', { mode: 'json' }),
  computedAt: integer('computed_at').notNull().$defaultFn(now),
})

export const tags = sqliteTable('tags', {
  id: uuid(),
  name: text('name').notNull().unique(),
  color: text('color'),
})

export const propertyTags = sqliteTable(
  'property_tags',
  {
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.propertyId, t.tagId] })],
)

export const notes = sqliteTable('notes', {
  id: uuid(),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: integer('created_at').notNull().$defaultFn(now),
})

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
})

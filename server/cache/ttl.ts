import type { EnrichmentSource } from '#shared/types/canonical'

// Per-source cache lifetimes (days). External data here is fairly static, and the snapshot cache
// means we essentially fetch each source once per property per TTL window.
export const TTL_DAYS: Record<EnrichmentSource, number> = {
  postcode: 36500, // effectively immutable
  police: 30, // monthly data releases
  flood: 365, // essentially static
  epc: 180, // certificates valid 10 years
  transit: 365, // stations rarely change
  land_registry: 90, // updated monthly
  tfl: 30, // network stable
  schools: 180, // inspections infrequent
  ons: 365, // census / annual
  council_tax: 365, // static per property
  broadband: 180, // slow-changing
}

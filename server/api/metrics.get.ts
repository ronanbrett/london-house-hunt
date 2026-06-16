import { METRICS } from '../services/scoring/metrics'

// Metric metadata for the weight editor (keeps the UI in sync with the registry).
export default defineEventHandler(() =>
  METRICS.map((m) => ({ key: m.key, label: m.label, category: m.category, defaultWeight: m.defaultWeight })),
)

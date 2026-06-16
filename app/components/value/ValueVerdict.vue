<script setup lang="ts">
interface ValueResult {
  sampleSize: number
  fairValue: number
  fairValueLow: number
  fairValueHigh: number
  deltaPct: number | null
  verdict: string | null
  valueScore: number | null
  hpiAdjusted: boolean
  comps: { amount: number; date: string; postcode?: string; propertyType?: string }[]
}
const props = defineProps<{ result?: ValueResult | null; loading?: boolean }>()

const VERDICT_META: Record<string, { label: string; color: string }> = {
  underpriced: { label: 'Underpriced', color: 'success' },
  slightly_below: { label: 'Slightly below market', color: 'success' },
  fair: { label: 'Fairly priced', color: 'info' },
  slightly_above: { label: 'Slightly above market', color: 'warning' },
  overpriced: { label: 'Overpriced', color: 'error' },
}
const meta = computed(() => (props.result?.verdict ? VERDICT_META[props.result.verdict] : null))
const deltaLabel = computed(() => {
  const d = props.result?.deltaPct
  if (d == null) return null
  const pct = Math.round(d * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% vs fair value`
})
</script>

<template>
  <div>
    <p v-if="loading" class="text-sm text-muted">Estimating from recent sold prices…</p>
    <div v-else-if="result && result.sampleSize > 0">
      <div class="flex items-center gap-3 flex-wrap">
        <UBadge v-if="meta" :color="(meta.color as any)" size="lg">{{ meta.label }}</UBadge>
        <span v-if="deltaLabel" class="text-sm text-muted">{{ deltaLabel }}</span>
      </div>
      <p class="text-sm mt-3">
        Fair value ≈
        <span class="font-semibold text-highlighted">{{ formatGBP(result.fairValue) }}</span>
        <span class="text-muted"> ({{ formatGBP(result.fairValueLow) }}–{{ formatGBP(result.fairValueHigh) }})</span>
      </p>
      <p class="text-xs text-muted mt-1">
        Based on {{ result.sampleSize }} recent nearby sales (HM Land Registry), compared on whole
        price (not yet size-adjusted).
        {{ result.hpiAdjusted ? 'Time-adjusted to today.' : 'Not time-adjusted.' }}
      </p>
      <ul class="mt-3 text-sm space-y-1">
        <li v-for="(c, i) in result.comps.slice(0, 5)" :key="i" class="flex justify-between gap-2">
          <span>{{ formatGBP(c.amount) }} <span class="text-dimmed capitalize">{{ (c.propertyType || '').replace(/-/g, ' ') }}</span></span>
          <span class="text-muted whitespace-nowrap">{{ c.date }}</span>
        </li>
      </ul>
    </div>
    <p v-else-if="result" class="text-sm text-muted">No recent comparable sales found nearby.</p>
    <p v-else class="text-sm text-muted">Estimate this property's value from recent sold prices.</p>
  </div>
</template>

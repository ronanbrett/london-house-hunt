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
  sizeAdjusted: boolean
  medianPpsf: number | null
  comps: { amount: number; date: string; postcode?: string; propertyType?: string; address?: string }[]
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

function landRegistryUrl(postcode?: string) {
  if (!postcode) return null
  return `https://www.gov.uk/search-house-prices/results?postcode=${encodeURIComponent(postcode)}`
}
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
      <p v-if="result.sizeAdjusted && result.medianPpsf" class="text-xs text-muted mt-1">
        Median £{{ Math.round(result.medianPpsf).toLocaleString('en-GB') }}/sq ft from {{ result.sampleSize }} nearby sales with known floor area.
      </p>
      <p class="text-xs text-muted mt-1">
        Based on {{ result.sampleSize }} recent nearby sales
        (<a href="https://www.gov.uk/search-house-prices" target="_blank" class="underline">HM Land Registry</a>).
        {{ result.sizeAdjusted ? 'Size-adjusted (£/sq ft).' : 'Compared on whole price (not size-adjusted).' }}
        {{ result.hpiAdjusted ? 'Time-adjusted (UK HPI).' : 'Not time-adjusted.' }}
      </p>
      <ul class="mt-3 text-sm space-y-2 divide-y divide-default">
        <li v-for="(c, i) in result.comps.slice(0, 8)" :key="i" class="pt-2 first:pt-0">
          <div class="flex justify-between gap-2">
            <span class="font-medium">{{ formatGBP(c.amount) }}</span>
            <span class="text-muted whitespace-nowrap text-xs">{{ c.date }}</span>
          </div>
          <div class="text-xs text-muted mt-0.5">
            <span v-if="c.address" class="capitalize">{{ c.address.toLowerCase() }}</span>
            <span v-if="c.postcode"> · {{ c.postcode }}</span>
            <span v-if="c.propertyType" class="capitalize"> · {{ (c.propertyType || '').replace(/-/g, ' ') }}</span>
          </div>
        </li>
      </ul>
      <a
        v-if="result.comps[0]?.postcode"
        :href="landRegistryUrl(result.comps[0].postcode)!"
        target="_blank"
        class="inline-block mt-3 text-xs text-primary hover:underline"
      >View area sales on Land Registry</a>
    </div>
    <p v-else-if="result" class="text-sm text-muted">No recent comparable sales found nearby.</p>
    <p v-else class="text-sm text-muted">Estimate this property's value from recent sold prices.</p>
  </div>
</template>

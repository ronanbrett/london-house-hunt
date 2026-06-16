<script setup lang="ts">
interface StationsDerived {
  stations: { name: string; modes: string[]; distanceMiles: number }[]
}
const props = defineProps<{ entry?: { status: string; derived: unknown } | null }>()
const d = computed(() => (props.entry?.derived as StationsDerived | undefined) ?? undefined)

const MODE_LABELS: Record<string, string> = {
  tube: 'Tube',
  overground: 'Overground',
  dlr: 'DLR',
  'elizabeth-line': 'Elizabeth line',
  'national-rail': 'Rail',
  tram: 'Tram',
}
const modeLabel = (m: string) => MODE_LABELS[m] ?? m
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-train-front" class="size-4" /> Stations</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>
    <ul v-if="d && d.stations.length" class="text-sm space-y-2">
      <li v-for="s in d.stations" :key="s.name" class="flex items-start justify-between gap-3">
        <div>
          <p class="text-default">{{ s.name }}</p>
          <div class="flex flex-wrap gap-1 mt-0.5">
            <UBadge v-for="m in s.modes" :key="m" size="sm" variant="subtle" color="neutral">{{ modeLabel(m) }}</UBadge>
          </div>
        </div>
        <span class="text-muted whitespace-nowrap">{{ s.distanceMiles }} mi</span>
      </li>
    </ul>
    <p v-else-if="entry" class="text-sm text-muted">No stations found nearby.</p>
    <p v-else class="text-sm text-muted">No station data loaded.</p>
  </UCard>
</template>

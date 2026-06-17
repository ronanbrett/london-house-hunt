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

type TravelMode = 'walking' | 'cycling' | 'scooter'
const travelMode = ref<TravelMode>('walking')
const TRAVEL_SPEEDS: Record<TravelMode, { mph: number; icon: string; label: string }> = {
  walking: { mph: 3, icon: 'i-lucide-footprints', label: 'Walk' },
  cycling: { mph: 10, icon: 'i-lucide-bike', label: 'Cycle' },
  scooter: { mph: 8, icon: 'i-lucide-zap', label: 'Scooter' },
}
const travelModes = Object.keys(TRAVEL_SPEEDS) as TravelMode[]

function travelMinutes(miles: number): number {
  return Math.round((miles / TRAVEL_SPEEDS[travelMode.value].mph) * 60)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-train-front" class="size-4" /> Stations</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>

    <div v-if="d && d.stations.length">
      <div class="flex gap-1 mb-3">
        <button
          v-for="m in travelModes"
          :key="m"
          class="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition"
          :class="travelMode === m ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-default'"
          @click="travelMode = m"
        >
          <UIcon :name="TRAVEL_SPEEDS[m].icon" class="size-3" />
          {{ TRAVEL_SPEEDS[m].label }}
        </button>
      </div>

      <ul class="text-sm space-y-2">
        <li v-for="s in d.stations" :key="s.name" class="flex items-start justify-between gap-3">
          <div>
            <p class="text-default">{{ s.name }}</p>
            <div class="flex flex-wrap gap-1 mt-0.5">
              <UBadge v-for="m in s.modes" :key="m" size="sm" variant="subtle" color="neutral">{{ modeLabel(m) }}</UBadge>
            </div>
          </div>
          <div class="text-right whitespace-nowrap">
            <span class="text-default font-medium">{{ travelMinutes(s.distanceMiles) }} min</span>
            <p class="text-xs text-muted">{{ s.distanceMiles }} mi</p>
          </div>
        </li>
      </ul>
    </div>
    <p v-else-if="entry" class="text-sm text-muted">No stations found nearby.</p>
    <p v-else class="text-sm text-muted">No station data loaded.</p>
  </UCard>
</template>

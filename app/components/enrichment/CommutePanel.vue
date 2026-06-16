<script setup lang="ts">
interface CommuteLeg { destinationId: string; label: string; minutes: number | null; mode: string }
interface CommuteDerived { destinations: CommuteLeg[]; blendedMinutes: number | null }
const props = defineProps<{ entry?: { status: string; derived: unknown } | null }>()
const d = computed(() => (props.entry?.derived as CommuteDerived | undefined) ?? undefined)
const fmt = (m: number | null) => (m == null ? '—' : `${m} min`)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-clock" class="size-4" /> Commute</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>
    <div v-if="d && d.destinations.length">
      <p v-if="d.blendedMinutes != null" class="text-sm mb-3">
        <span class="text-2xl font-bold text-highlighted">{{ d.blendedMinutes }}</span>
        min <span class="text-muted">weighted average</span>
      </p>
      <ul class="text-sm space-y-1">
        <li v-for="leg in d.destinations" :key="leg.destinationId" class="flex justify-between">
          <span>{{ leg.label }} <span class="text-dimmed">({{ leg.mode }})</span></span>
          <span class="text-muted">{{ fmt(leg.minutes) }}</span>
        </li>
      </ul>
    </div>
    <p v-else-if="entry" class="text-sm text-muted">
      No destinations set. Add some in <NuxtLink to="/settings/destinations" class="text-primary">Settings</NuxtLink>.
    </p>
    <p v-else class="text-sm text-muted">No commute data loaded.</p>
  </UCard>
</template>

<script setup lang="ts">
interface FloodDerived {
  areaCount: number
  areas: { description: string; riverOrSea: string | null }[]
}
const props = defineProps<{ entry?: { status: string; derived: unknown } | null }>()
const d = computed(() => (props.entry?.derived as FloodDerived | undefined) ?? undefined)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-waves" class="size-4" /> Flood risk</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>
    <div v-if="d">
      <p v-if="d.areaCount === 0" class="text-sm text-success">
        No designated flood areas within 2&nbsp;km.
      </p>
      <div v-else>
        <p class="text-sm">
          <span class="text-2xl font-bold text-highlighted">{{ d.areaCount }}</span>
          flood {{ d.areaCount === 1 ? 'area' : 'areas' }} within 2&nbsp;km
        </p>
        <ul class="mt-3 text-sm space-y-1">
          <li v-for="(a, i) in d.areas" :key="i" class="flex justify-between gap-2">
            <span class="line-clamp-1">{{ a.description }}</span>
            <span v-if="a.riverOrSea" class="text-muted whitespace-nowrap">{{ a.riverOrSea }}</span>
          </li>
        </ul>
      </div>
    </div>
    <p v-else class="text-sm text-muted">No flood data loaded.</p>
  </UCard>
</template>

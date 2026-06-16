<script setup lang="ts">
interface CrimeDerived {
  month: string | null
  total: number
  byCategory: { category: string; count: number }[]
}
const props = defineProps<{ entry?: { status: string; derived: unknown } | null }>()
const d = computed(() => (props.entry?.derived as CrimeDerived | undefined) ?? undefined)

function humanize(s: string) {
  return s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-shield-alert" class="size-4" /> Crime</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>
    <div v-if="d">
      <p class="text-sm">
        <span class="text-2xl font-bold text-highlighted">{{ d.total }}</span>
        crimes
        <span class="text-muted">in the latest month{{ d.month ? ` (${d.month})` : '' }}, ~1 mile radius</span>
      </p>
      <ul class="mt-3 text-sm space-y-1">
        <li v-for="c in d.byCategory.slice(0, 5)" :key="c.category" class="flex justify-between">
          <span>{{ humanize(c.category) }}</span>
          <span class="text-muted">{{ c.count }}</span>
        </li>
      </ul>
    </div>
    <p v-else class="text-sm text-muted">No crime data loaded.</p>
  </UCard>
</template>

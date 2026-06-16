<script setup lang="ts">
useHead({ title: 'Compare · London House-Hunt' })

interface CompareColumn { id: string; displayAddress: string | null; price: number | null; floorAreaSqft: number | null; beds: number | null; total: number; confidence: number }
interface CompareCell { id: string; value: number | null }
interface CompareRow { key: string; label: string; category: string; cells: CompareCell[]; bestId: string | null }
interface CompareResult { columns: CompareColumn[]; rows: CompareRow[] }

interface PropertyListItem { id: string; displayAddress: string | null; price: number | null }

const store = useComparisonStore()
const { data: properties } = await useFetch<PropertyListItem[]>('/api/properties', { default: () => [] })

const mode = ref<'absolute' | 'relative'>('absolute')
const result = ref<CompareResult | null>(null)
const loading = ref(false)

async function run() {
  if (store.ids.length < 2) {
    result.value = null
    return
  }
  loading.value = true
  try {
    result.value = await $fetch<CompareResult>('/api/compare', { method: 'POST', body: { ids: store.ids } })
  } finally {
    loading.value = false
  }
}
watch(() => store.ids.slice(), run, { immediate: true })

// Relative mode rescales each metric row across the cohort (min→0, max→100).
const rows = computed<CompareRow[]>(() => {
  const res = result.value
  if (!res) return []
  if (mode.value === 'absolute') return res.rows
  return res.rows.map((row) => {
    const vals = row.cells.map((c) => c.value).filter((v): v is number => v != null)
    if (!vals.length) return row
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const cells = row.cells.map((c) => ({
      id: c.id,
      value: c.value == null ? null : max === min ? 100 : Math.round(((c.value - min) / (max - min)) * 100),
    }))
    const present = cells.filter((c): c is { id: string; value: number } => c.value != null)
    const bestId = present.length ? present.reduce((a, b) => (b.value > a.value ? b : a)).id : null
    return { ...row, cells, bestId }
  })
})
const columns = computed(() => result.value?.columns ?? [])
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-highlighted">Compare properties</h1>
      <UButton v-if="store.ids.length" variant="ghost" color="neutral" label="Clear" @click="store.clear()" />
    </div>

    <!-- selector -->
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="p in properties"
        :key="p.id"
        :label="p.displayAddress ?? 'Property'"
        :color="store.has(p.id) ? 'primary' : 'neutral'"
        :variant="store.has(p.id) ? 'solid' : 'outline'"
        :icon="store.has(p.id) ? 'i-lucide-check' : 'i-lucide-plus'"
        size="sm"
        @click="store.toggle(p.id)"
      />
      <p v-if="!properties.length" class="text-sm text-muted">No saved properties yet.</p>
    </div>

    <div v-if="store.ids.length < 2" class="rounded-lg border border-dashed border-default p-10 text-center text-muted">
      Select at least two properties above to compare them.
    </div>

    <div v-else>
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm text-muted">Scoring:</span>
        <UButton size="xs" :variant="mode === 'absolute' ? 'solid' : 'outline'" color="neutral" label="Absolute" @click="mode = 'absolute'" />
        <UButton size="xs" :variant="mode === 'relative' ? 'solid' : 'outline'" color="neutral" label="Relative" @click="mode = 'relative'" />
        <span v-if="loading" class="text-sm text-muted">Scoring…</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="text-left p-2 font-medium text-muted">Metric</th>
              <th v-for="col in columns" :key="col.id" class="text-left p-2 align-top min-w-40">
                <NuxtLink :to="`/properties/${col.id}`" class="font-semibold text-highlighted line-clamp-1 hover:text-primary">
                  {{ col.displayAddress ?? 'Property' }}
                </NuxtLink>
                <div class="text-xs text-muted">{{ formatGBP(col.price) }}</div>
                <div class="mt-1 text-lg font-bold text-highlighted">{{ col.total }}<span class="text-xs text-muted">/100</span></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" class="border-t border-default">
              <td class="p-2 text-default">{{ row.label }}</td>
              <td
                v-for="cell in row.cells"
                :key="cell.id"
                class="p-2"
                :class="cell.id === row.bestId ? 'bg-primary/10 font-semibold text-highlighted' : 'text-muted'"
              >
                {{ cell.value == null ? '—' : cell.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted mt-3">
        Cells are 0–100 metric scores ({{ mode }}). Highlighted = best of the selected set.
        Tune what matters in Destinations/Profiles.
      </p>
    </div>
  </div>
</template>

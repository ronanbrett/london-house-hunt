<script setup lang="ts">
useHead({ title: 'Scoring weights · London House-Hunt' })

interface MetricMeta { key: string; label: string; category: string; defaultWeight: number }

const { data: metrics } = await useFetch<MetricMeta[]>('/api/metrics', { default: () => [] })
const { data: weightsData, refresh } = await useFetch<{ weights: Record<string, number> }>(
  '/api/profile/weights',
  { default: () => ({ weights: {} }) },
)

const weights = reactive<Record<string, number>>({})
watchEffect(() => {
  for (const m of metrics.value) {
    weights[m.key] = weightsData.value.weights[m.key] ?? m.defaultWeight
  }
})

const saving = ref(false)
const saved = ref(false)
async function save() {
  saving.value = true
  saved.value = false
  try {
    await $fetch('/api/profile/weights', { method: 'PUT', body: { weights: { ...weights } } })
    await refresh()
    saved.value = true
  } finally {
    saving.value = false
  }
}
function resetDefaults() {
  for (const m of metrics.value) weights[m.key] = m.defaultWeight
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-highlighted mb-1">Scoring weights</h1>
    <p class="text-muted mb-6">
      Tune how much each factor matters for your "Home to live in" score. 0 = ignore, 10 = most
      important. Affects every property's score and the comparison.
    </p>

    <UCard>
      <div class="space-y-4">
        <div v-for="m in metrics" :key="m.key">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-default">{{ m.label }} <span class="text-dimmed text-xs">· {{ m.category }}</span></span>
            <span class="font-medium text-highlighted tabular-nums">{{ weights[m.key] }}</span>
          </div>
          <input
            v-model.number="weights[m.key]"
            type="range"
            min="0"
            max="10"
            step="1"
            class="w-full accent-primary"
          >
        </div>
      </div>
      <template #footer>
        <div class="flex items-center gap-3">
          <UButton label="Save" icon="i-lucide-save" :loading="saving" @click="save" />
          <UButton label="Reset to defaults" variant="ghost" color="neutral" @click="resetDefaults" />
          <span v-if="saved" class="text-sm text-success">Saved ✓</span>
        </div>
      </template>
    </UCard>
  </div>
</template>

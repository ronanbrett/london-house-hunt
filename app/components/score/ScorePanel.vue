<script setup lang="ts">
interface Contribution {
  key: string
  label: string
  category: string
  normalized: number
  weight: number
  missing: boolean
}
interface PropertyScore {
  total: number
  confidence: number
  contributions: Contribution[]
}
const props = defineProps<{ score?: PropertyScore | null }>()

function barColor(n: number): string {
  if (n >= 75) return 'bg-green-500'
  if (n >= 55) return 'bg-sky-500'
  if (n >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}
const totalColor = computed(() => {
  const t = props.score?.total ?? 0
  if (t >= 75) return 'text-green-600 dark:text-green-400'
  if (t >= 55) return 'text-sky-600 dark:text-sky-400'
  if (t >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})
</script>

<template>
  <div v-if="score">
    <div class="flex items-baseline gap-4">
      <div class="text-4xl font-bold" :class="totalColor">
        {{ score.total }}<span class="text-lg text-muted">/100</span>
      </div>
      <div class="text-sm text-muted">
        {{ Math.round(score.confidence * 100) }}% confidence
        <p class="text-xs text-dimmed">based on available data</p>
      </div>
    </div>
    <ul class="mt-4 space-y-2">
      <li v-for="c in score.contributions" :key="c.key">
        <div class="flex justify-between text-xs mb-0.5">
          <span :class="c.missing ? 'text-dimmed' : 'text-default'">
            {{ c.label }}<span v-if="c.missing"> (no data)</span>
          </span>
          <span class="text-muted">{{ c.normalized }}</span>
        </div>
        <div class="h-1.5 rounded bg-elevated overflow-hidden">
          <div class="h-full rounded" :class="barColor(c.normalized)" :style="{ width: `${c.normalized}%` }" />
        </div>
      </li>
    </ul>
  </div>
  <p v-else class="text-sm text-muted">No score yet.</p>
</template>

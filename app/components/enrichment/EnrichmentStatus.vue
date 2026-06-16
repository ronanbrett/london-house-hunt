<script setup lang="ts">
const props = defineProps<{ status?: string }>()
const map: Record<string, { label: string; color: string }> = {
  fresh: { label: 'Updated', color: 'success' },
  ok: { label: 'OK', color: 'success' },
  cached: { label: 'Cached', color: 'neutral' },
  'stale-error': { label: 'Stale', color: 'warning' },
  error: { label: 'Error', color: 'error' },
  no_match: { label: 'No data', color: 'neutral' },
  skipped: { label: 'Skipped', color: 'neutral' },
}
const m = computed(() => (props.status ? (map[props.status] ?? { label: props.status, color: 'neutral' }) : null))
</script>

<template>
  <UBadge v-if="m" :color="(m.color as any)" variant="subtle" size="sm">{{ m.label }}</UBadge>
</template>

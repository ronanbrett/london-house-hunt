<script setup lang="ts">
const props = defineProps<{ status: string }>()
const color = computed(() => (STATUS_COLORS[props.status] ?? 'neutral') as any)
</script>

<template>
  <UBadge :color="color" variant="subtle" class="capitalize">{{ status }}</UBadge>
</template>

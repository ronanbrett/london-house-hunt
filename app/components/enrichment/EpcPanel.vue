<script setup lang="ts">
interface EpcDerived {
  current?: string
  potential?: string
  floorAreaSqft?: number
  uprn?: string
  address?: string
}
const props = defineProps<{ entry?: { status: string; derived: unknown } | null }>()
const d = computed(() => (props.entry?.derived as EpcDerived | undefined) ?? undefined)

const ratingColors: Record<string, string> = {
  A: 'success', B: 'success', C: 'success',
  D: 'warning', E: 'warning', F: 'error', G: 'error',
}
const color = (r?: string) => (ratingColors[r ?? ''] ?? 'neutral') as string
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-zap" class="size-4" /> EPC</span>
        <EnrichmentStatus :status="entry?.status" />
      </div>
    </template>
    <div v-if="d && d.current">
      <div class="flex items-center gap-3">
        <UBadge :color="(color(d.current) as any)" size="lg">{{ d.current }}</UBadge>
        <span class="text-sm text-muted">
          current<template v-if="d.potential"> · potential {{ d.potential }}</template>
        </span>
      </div>
      <p v-if="d.floorAreaSqft" class="text-sm mt-3">
        Floor area: <span class="font-medium text-default">{{ d.floorAreaSqft.toLocaleString('en-GB') }} sq ft</span>
      </p>
    </div>
    <p v-else-if="entry?.status === 'no_match'" class="text-sm text-muted">
      No EPC matched (set an EPC API key in <code>.env</code>, or no certificate on file).
    </p>
    <p v-else class="text-sm text-muted">No EPC data loaded.</p>
  </UCard>
</template>

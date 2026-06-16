<script setup lang="ts">
useHead({ title: 'Dashboard · London House-Hunt' })

const { data: properties, status } = await useFetch('/api/properties', { default: () => [] })
const { data: scores } = await useFetch<Record<string, { total: number; confidence: number }>>(
  '/api/properties/scores',
  { default: () => ({}) },
)
const store = useComparisonStore()

function scoreBg(total?: number) {
  if (total == null) return 'bg-neutral-500'
  if (total >= 75) return 'bg-green-600'
  if (total >= 55) return 'bg-sky-600'
  if (total >= 40) return 'bg-amber-600'
  return 'bg-red-600'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-highlighted">Saved properties</h1>
      <UButton to="/import" icon="i-lucide-plus" label="Add property" color="primary" />
    </div>

    <div
      v-if="store.ids.length"
      class="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2"
    >
      <span class="text-sm text-default">{{ store.ids.length }} selected for comparison</span>
      <UButton size="xs" to="/compare" icon="i-lucide-columns-3" label="Compare" />
      <UButton size="xs" variant="ghost" color="neutral" label="Clear" @click="store.clear()" />
    </div>

    <div v-if="status === 'pending'" class="text-muted">Loading…</div>

    <div
      v-else-if="!properties || properties.length === 0"
      class="rounded-lg border border-dashed border-default p-12 text-center text-muted"
    >
      <UIcon name="i-lucide-house-plus" class="size-10 mx-auto mb-3 text-dimmed" />
      <p class="font-medium text-default">No properties yet</p>
      <p class="text-sm">Add one from a Rightmove/Zoopla link, the bookmarklet, or by hand.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in properties"
        :key="p.id"
        class="group relative rounded-lg border border-default overflow-hidden hover:ring-2 hover:ring-primary transition"
      >
        <button
          class="absolute top-2 right-2 z-10 rounded-md p-1.5 backdrop-blur transition"
          :class="store.has(p.id) ? 'bg-primary text-inverted' : 'bg-default/80 text-muted hover:text-default'"
          :title="store.has(p.id) ? 'Remove from comparison' : 'Add to comparison'"
          @click="store.toggle(p.id)"
        >
          <UIcon :name="store.has(p.id) ? 'i-lucide-check' : 'i-lucide-git-compare'" class="size-4" />
        </button>

        <NuxtLink :to="`/properties/${p.id}`" class="block">
          <div class="relative aspect-video bg-elevated overflow-hidden">
            <img
              v-if="p.thumbnail"
              :src="p.thumbnail"
              :alt="p.displayAddress ?? 'Property'"
              class="size-full object-cover group-hover:scale-105 transition"
            >
            <div v-else class="size-full grid place-items-center text-dimmed">
              <UIcon name="i-lucide-image-off" class="size-8" />
            </div>
            <div
              v-if="scores[p.id]"
              class="absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-sm font-bold text-white"
              :class="scoreBg(scores[p.id]?.total)"
              :title="`Score ${scores[p.id]?.total}/100`"
            >
              {{ scores[p.id]?.total }}
            </div>
          </div>
          <div class="p-3 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-highlighted">{{ formatGBP(p.price) }}</span>
              <PropertyStatusBadge :status="p.status" />
            </div>
            <p class="text-sm text-default line-clamp-1">{{ p.displayAddress ?? 'No address' }}</p>
            <div class="flex items-center gap-3 text-xs text-muted">
              <span v-if="p.beds != null"><UIcon name="i-lucide-bed" class="size-3" /> {{ p.beds }}</span>
              <span v-if="p.baths != null"><UIcon name="i-lucide-bath" class="size-3" /> {{ p.baths }}</span>
              <span>{{ pricePerSqft(p.price, p.floorAreaSqft) }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

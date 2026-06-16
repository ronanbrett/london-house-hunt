<script setup lang="ts">
useHead({ title: 'Dashboard · London House-Hunt' })

const { data: properties, status } = await useFetch('/api/properties', { default: () => [] })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-highlighted">Saved properties</h1>
      <UButton to="/import" icon="i-lucide-plus" label="Add property" color="primary" />
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
      <NuxtLink
        v-for="p in properties"
        :key="p.id"
        :to="`/properties/${p.id}`"
        class="group rounded-lg border border-default overflow-hidden hover:ring-2 hover:ring-primary transition"
      >
        <div class="aspect-video bg-elevated overflow-hidden">
          <img
            v-if="p.thumbnail"
            :src="p.thumbnail"
            :alt="p.displayAddress ?? 'Property'"
            class="size-full object-cover group-hover:scale-105 transition"
          >
          <div v-else class="size-full grid place-items-center text-dimmed">
            <UIcon name="i-lucide-image-off" class="size-8" />
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
</template>

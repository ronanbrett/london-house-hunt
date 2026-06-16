<script setup lang="ts">
const links = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Add property', icon: 'i-lucide-plus', to: '/import' },
  { label: 'Compare', icon: 'i-lucide-columns-3', to: '/compare' },
  { label: 'Destinations', icon: 'i-lucide-map-pin', to: '/settings/destinations' },
  { label: 'Weights', icon: 'i-lucide-sliders-horizontal', to: '/settings/profiles' },
]
</script>

<template>
  <div class="min-h-screen bg-default text-default">
    <header class="border-b border-default bg-default/75 backdrop-blur sticky top-0 z-10">
      <div class="mx-auto max-w-7xl px-4 h-14 flex items-center gap-2">
        <NuxtLink to="/" class="font-semibold text-highlighted flex items-center gap-2 mr-4">
          <UIcon name="i-lucide-home" class="size-5 text-primary" />
          <span>London House-Hunt</span>
        </NuxtLink>
        <nav class="flex items-center gap-1">
          <UButton
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

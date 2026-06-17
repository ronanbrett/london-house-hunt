<script setup lang="ts">
const mainLinks = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Add property', icon: 'i-lucide-plus', to: '/import' },
  { label: 'Compare', icon: 'i-lucide-columns-3', to: '/compare' },
]

const settingsLinks = [
  { label: 'Destinations', icon: 'i-lucide-map-pin', to: '/settings/destinations' },
  { label: 'Weights', icon: 'i-lucide-sliders-horizontal', to: '/settings/profiles' },
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header>
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold text-highlighted">
          <UIcon name="i-lucide-home" class="size-5 text-primary" />
          <span>London House-Hunt</span>
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="mainLinks"
        orientation="vertical"
        highlight
      />

      <USeparator />

      <UNavigationMenu
        :items="settingsLinks"
        orientation="vertical"
        highlight
      />
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :toggle="{ class: 'lg:hidden' }">
          <template #right>
            <UColorModeButton />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

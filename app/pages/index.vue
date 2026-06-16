<script setup lang="ts">
useHead({ title: 'Dashboard · London House-Hunt' })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-highlighted">Saved properties</h1>
      <UButton to="/import" icon="i-lucide-plus" label="Add property" color="primary" />
    </div>

    <div class="rounded-lg border border-dashed border-default p-12 text-center text-muted">
      <UIcon name="i-lucide-house-plus" class="size-10 mx-auto mb-3 text-dimmed" />
      <p class="font-medium text-default">No properties yet</p>
      <p class="text-sm">Add one from a Rightmove/Zoopla link, the bookmarklet, or by hand.</p>
    </div>
  </div>
</template>

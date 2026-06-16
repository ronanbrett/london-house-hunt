<script setup lang="ts">
useHead({ title: 'Destinations · London House-Hunt' })

interface Destination {
  id: string
  label: string
  postcode?: string | null
  lat: number | null
  lng: number | null
  mode: string
  importance: number
}

const { data: destinations, refresh } = await useFetch<Destination[]>('/api/destinations', {
  default: () => [],
})

const form = reactive({ label: '', postcode: '', mode: 'transit', importance: 3 })
const error = ref('')
const saving = ref(false)

async function add() {
  error.value = ''
  if (!form.label.trim() || !form.postcode.trim()) {
    error.value = 'Label and postcode are required.'
    return
  }
  saving.value = true
  try {
    await $fetch('/api/destinations', {
      method: 'POST',
      body: {
        label: form.label,
        postcode: form.postcode,
        mode: form.mode,
        importance: Number(form.importance),
      },
    })
    form.label = ''
    form.postcode = ''
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Could not add destination.'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  await $fetch(`/api/destinations/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-highlighted mb-1">Commute destinations</h1>
    <p class="text-muted mb-6">
      Places you travel to often (work, family, gym). Each property's commute is scored as an
      importance-weighted blend of journey times to these.
    </p>

    <UCard class="mb-6">
      <template #header>Add a destination</template>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-sm text-muted">Label</label>
          <UInput v-model="form.label" class="w-full mt-1" placeholder="Work" />
        </div>
        <div>
          <label class="text-sm text-muted">Postcode</label>
          <UInput v-model="form.postcode" class="w-full mt-1" placeholder="EC2A 4NE" />
        </div>
        <div>
          <label class="text-sm text-muted">Mode</label>
          <select v-model="form.mode" class="w-full mt-1 rounded-md border border-default bg-default px-3 py-1.5 text-sm">
            <option value="transit">Public transport</option>
            <option value="walking">Walking</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-muted">Importance (1–5)</label>
          <UInput v-model="form.importance" type="number" min="1" max="5" class="w-full mt-1" />
        </div>
      </div>
      <p v-if="error" class="text-sm text-error mt-3">{{ error }}</p>
      <UButton class="mt-4" label="Add" icon="i-lucide-plus" :loading="saving" @click="add" />
    </UCard>

    <div v-if="destinations.length" class="space-y-2">
      <div
        v-for="dst in destinations"
        :key="dst.id"
        class="flex items-center justify-between rounded-lg border border-default px-4 py-2"
      >
        <div>
          <p class="font-medium text-default">{{ dst.label }}</p>
          <p class="text-xs text-muted">{{ dst.mode }} · importance {{ dst.importance }}<span v-if="dst.lat == null"> · ⚠ not geocoded</span></p>
        </div>
        <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="sm" @click="remove(dst.id)" />
      </div>
    </div>
    <p v-else class="text-muted text-sm">No destinations yet.</p>
  </div>
</template>

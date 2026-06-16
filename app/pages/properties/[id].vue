<script setup lang="ts">
interface PropertyDetail {
  id: string
  status: string
  displayAddress: string | null
  postcode: string | null
  price: number | null
  priceQualifier: string | null
  propertyType: string | null
  tenure: string | null
  leaseYearsRemaining: number | null
  serviceChargeAnnual: number | null
  groundRentAnnual: number | null
  beds: number | null
  baths: number | null
  receptions: number | null
  floorAreaSqft: number | null
  councilTaxBand: string | null
  epcCurrent: string | null
  description: string | null
  sourceUrl: string | null
  lat: number | null
  lng: number | null
}
interface PropertyBundle {
  property: PropertyDetail
  photos: { id: string; url: string; caption: string | null }[]
  floorplans: { id: string; url: string; caption: string | null }[]
  stations: { id: string; name: string; distanceMiles: number | null }[]
  notes: { id: string; body: string; createdAt: number }[]
}

const route = useRoute()
const id = route.params.id as string

const { data, error, refresh } = await useFetch<PropertyBundle>(`/api/properties/${id}`)

const property = computed(() => data.value?.property)
useHead(() => ({ title: `${property.value?.displayAddress ?? 'Property'} · London House-Hunt` }))

const facts = computed(() => {
  const p = property.value
  if (!p) return []
  return [
    { label: 'Price', value: formatGBP(p.price) + (p.priceQualifier ? ` (${p.priceQualifier})` : '') },
    { label: '£ / sq ft', value: pricePerSqft(p.price, p.floorAreaSqft) },
    { label: 'Bedrooms', value: p.beds ?? '—' },
    { label: 'Bathrooms', value: p.baths ?? '—' },
    { label: 'Receptions', value: p.receptions ?? '—' },
    { label: 'Floor area', value: p.floorAreaSqft ? `${p.floorAreaSqft.toLocaleString('en-GB')} sq ft` : '—' },
    { label: 'Type', value: p.propertyType ?? '—' },
    { label: 'Tenure', value: p.tenure ? p.tenure.replace(/_/g, ' ') + (p.leaseYearsRemaining ? ` · ${p.leaseYearsRemaining}y left` : '') : '—' },
    { label: 'Service charge', value: p.serviceChargeAnnual ? `${formatGBP(p.serviceChargeAnnual)}/yr` : '—' },
    { label: 'Ground rent', value: p.groundRentAnnual ? `${formatGBP(p.groundRentAnnual)}/yr` : '—' },
    { label: 'Council tax', value: p.councilTaxBand ? `Band ${p.councilTaxBand}` : '—' },
    { label: 'EPC', value: p.epcCurrent ?? '—' },
  ]
})

const note = ref('')
async function addNote() {
  if (!note.value.trim()) return
  await $fetch(`/api/properties/${id}/notes`, { method: 'POST', body: { body: note.value } })
  note.value = ''
  await refresh()
}
async function setStatus(status: string) {
  await $fetch(`/api/properties/${id}/status`, { method: 'PATCH', body: { status } })
  await refresh()
}
async function remove() {
  if (!confirm('Delete this property? This cannot be undone.')) return
  await $fetch(`/api/properties/${id}`, { method: 'DELETE' })
  await navigateTo('/')
}

function formatDate(ms?: number | null) {
  return ms ? new Date(ms).toLocaleDateString('en-GB') : ''
}
</script>

<template>
  <div v-if="error" class="rounded-lg border border-dashed border-default p-12 text-center text-muted">
    <UIcon name="i-lucide-search-x" class="size-10 mx-auto mb-3 text-dimmed" />
    <p class="font-medium text-default">Property not found</p>
    <UButton to="/" variant="link" label="Back to dashboard" />
  </div>

  <div v-else-if="property" class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <UButton to="/" variant="link" icon="i-lucide-arrow-left" label="Dashboard" class="px-0 mb-1" />
        <h1 class="text-2xl font-bold text-highlighted">{{ property.displayAddress ?? 'Property' }}</h1>
        <p class="text-muted">{{ property.postcode }} · {{ formatGBP(property.price) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <select
          :value="property.status"
          class="rounded-md border border-default bg-default px-3 py-1.5 text-sm capitalize"
          @change="setStatus(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="s in PROPERTY_STATUSES" :key="s" :value="s" class="capitalize">{{ s }}</option>
        </select>
        <UButton color="error" variant="soft" icon="i-lucide-trash-2" label="Delete" @click="remove" />
        <UButton
          v-if="property.sourceUrl"
          :to="property.sourceUrl"
          target="_blank"
          color="neutral"
          variant="outline"
          icon="i-lucide-external-link"
          label="Listing"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Photos -->
        <div v-if="data?.photos?.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <img
            v-for="ph in data.photos"
            :key="ph.id"
            :src="ph.url"
            :alt="ph.caption ?? 'Photo'"
            class="aspect-square object-cover rounded-md border border-default"
          >
        </div>

        <!-- Facts -->
        <UCard>
          <template #header>Key facts</template>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="f in facts" :key="f.label">
              <dt class="text-xs text-muted">{{ f.label }}</dt>
              <dd class="font-medium text-default capitalize">{{ f.value }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Description -->
        <UCard v-if="property.description">
          <template #header>Description</template>
          <p class="text-sm text-default whitespace-pre-line">{{ property.description }}</p>
        </UCard>
      </div>

      <div class="space-y-6">
        <!-- Map -->
        <PropertyMap v-if="property.lat != null && property.lng != null" :lat="property.lat" :lng="property.lng" />

        <!-- Stations -->
        <UCard v-if="data?.stations?.length">
          <template #header>Nearest stations</template>
          <ul class="text-sm space-y-1">
            <li v-for="st in data.stations" :key="st.id" class="flex justify-between">
              <span>{{ st.name }}</span>
              <span class="text-muted">{{ st.distanceMiles != null ? `${st.distanceMiles} mi` : '' }}</span>
            </li>
          </ul>
        </UCard>

        <!-- Notes -->
        <UCard>
          <template #header>Notes</template>
          <div class="space-y-3">
            <div class="flex gap-2">
              <UInput v-model="note" placeholder="Add a note…" class="flex-1" @keydown.enter="addNote" />
              <UButton icon="i-lucide-plus" :disabled="!note.trim()" @click="addNote" />
            </div>
            <ul class="space-y-2">
              <li v-for="n in data?.notes ?? []" :key="n.id" class="text-sm border-b border-default pb-2">
                <p class="text-default">{{ n.body }}</p>
                <p class="text-xs text-dimmed">{{ formatDate(n.createdAt) }}</p>
              </li>
            </ul>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

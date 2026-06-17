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

interface EnrichmentEntry { status: string; derived: unknown; fetchedAt: number }
const { data: enrichment, refresh: refreshEnrichment } = await useFetch<Record<string, EnrichmentEntry>>(
  `/api/properties/${id}/enrichment`,
  { default: () => ({}) },
)

interface ScoreContribution { key: string; label: string; category: string; normalized: number; weight: number; missing: boolean }
interface PropertyScore { total: number; confidence: number; contributions: ScoreContribution[] }
const { data: score, refresh: refreshScore } = await useFetch<PropertyScore | null>(
  `/api/properties/${id}/score`,
  { default: () => null },
)

const enriching = ref(false)
async function runEnrich() {
  enriching.value = true
  try {
    await $fetch(`/api/properties/${id}/enrich?force=true`, { method: 'POST' })
    await refreshEnrichment()
    await refreshScore()
  } finally {
    enriching.value = false
  }
}

const property = computed(() => data.value?.property)
useHead(() => ({ title: `${property.value?.displayAddress ?? 'Property'} · London House-Hunt` }))

interface ValueResult {
  sampleSize: number
  fairValue: number
  fairValueLow: number
  fairValueHigh: number
  deltaPct: number | null
  verdict: string | null
  valueScore: number | null
  hpiAdjusted: boolean
  comps: { amount: number; date: string; postcode?: string; propertyType?: string }[]
}
const value = ref<ValueResult | null>(null)
const valueLoading = ref(false)
async function estimateValue() {
  valueLoading.value = true
  try {
    value.value = await $fetch<ValueResult>(`/api/properties/${id}/value`)
    await refreshScore()
  } catch {
    value.value = null
  } finally {
    valueLoading.value = false
  }
}

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

const editing = ref(false)
const saving = ref(false)
const draft = reactive({
  price: null as number | null,
  priceQualifier: '',
  beds: null as number | null,
  baths: null as number | null,
  receptions: null as number | null,
  floorAreaSqft: null as number | null,
  propertyType: '',
  tenure: null as string | null,
  leaseYearsRemaining: null as number | null,
  serviceChargeAnnual: null as number | null,
  groundRentAnnual: null as number | null,
  councilTaxBand: '',
  epcCurrent: '',
})

function startEdit() {
  const p = property.value
  if (!p) return
  Object.assign(draft, {
    price: p.price,
    priceQualifier: p.priceQualifier ?? '',
    beds: p.beds,
    baths: p.baths,
    receptions: p.receptions,
    floorAreaSqft: p.floorAreaSqft,
    propertyType: p.propertyType ?? '',
    tenure: p.tenure,
    leaseYearsRemaining: p.leaseYearsRemaining,
    serviceChargeAnnual: p.serviceChargeAnnual,
    groundRentAnnual: p.groundRentAnnual,
    councilTaxBand: p.councilTaxBand ?? '',
    epcCurrent: p.epcCurrent ?? '',
  })
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function numOrNull(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function saveFacts() {
  saving.value = true
  try {
    await $fetch(`/api/properties/${id}/facts`, {
      method: 'PATCH',
      body: {
        price: numOrNull(draft.price),
        priceQualifier: draft.priceQualifier || null,
        beds: numOrNull(draft.beds),
        baths: numOrNull(draft.baths),
        receptions: numOrNull(draft.receptions),
        floorAreaSqft: numOrNull(draft.floorAreaSqft),
        propertyType: draft.propertyType || null,
        tenure: draft.tenure || null,
        leaseYearsRemaining: numOrNull(draft.leaseYearsRemaining),
        serviceChargeAnnual: numOrNull(draft.serviceChargeAnnual),
        groundRentAnnual: numOrNull(draft.groundRentAnnual),
        councilTaxBand: draft.councilTaxBand || null,
        epcCurrent: draft.epcCurrent || null,
      },
    })
    await refresh()
    await refreshScore()
    editing.value = false
  } finally {
    saving.value = false
  }
}

const areaUnit = ref<AreaUnit>('sqft')
function toggleAreaUnit() {
  areaUnit.value = areaUnit.value === 'sqft' ? 'sqm' : 'sqft'
}

const draftPricePerArea = computed(() =>
  pricePerArea(numOrNull(draft.price), numOrNull(draft.floorAreaSqft), areaUnit.value),
)
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
        <!-- Score -->
        <UCard>
          <template #header>
            <span class="flex items-center gap-2"><UIcon name="i-lucide-gauge" class="size-4" /> Score</span>
          </template>
          <ScorePanel :score="score" />
        </UCard>

        <!-- Facts -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span>Key facts</span>
              <div class="flex items-center gap-2">
                <template v-if="editing">
                  <UButton size="xs" icon="i-lucide-check" label="Save" :loading="saving" @click="saveFacts" />
                  <UButton size="xs" variant="ghost" color="neutral" label="Cancel" @click="cancelEdit" />
                </template>
                <UButton
                  v-else
                  size="xs"
                  variant="outline"
                  icon="i-lucide-pencil"
                  label="Edit"
                  @click="startEdit"
                />
              </div>
            </div>
          </template>

          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt class="text-xs text-muted">Price</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ formatGBP(property?.price) }}{{ property?.priceQualifier ? ` (${property.priceQualifier})` : '' }}</dd>
              <UInput v-else v-model.number="draft.price" type="number" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted flex items-center gap-1">
                {{ areaUnit === 'sqft' ? '£ / sq ft' : '£ / m²' }}
                <button class="text-primary hover:underline text-xs" @click="toggleAreaUnit">
                  {{ areaUnit === 'sqft' ? 'm²' : 'sq ft' }}
                </button>
              </dt>
              <dd class="font-medium text-default">{{ editing ? draftPricePerArea : pricePerArea(property?.price, property?.floorAreaSqft, areaUnit) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">Bedrooms</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.beds ?? '—' }}</dd>
              <UInput v-else v-model.number="draft.beds" type="number" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted">Bathrooms</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.baths ?? '—' }}</dd>
              <UInput v-else v-model.number="draft.baths" type="number" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted">Receptions</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.receptions ?? '—' }}</dd>
              <UInput v-else v-model.number="draft.receptions" type="number" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted">Floor area</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ formatArea(property?.floorAreaSqft, areaUnit) }}</dd>
              <UInput v-else v-model.number="draft.floorAreaSqft" type="number" size="sm" placeholder="sq ft" />
            </div>
            <div>
              <dt class="text-xs text-muted">Type</dt>
              <dd v-if="!editing" class="font-medium text-default capitalize">{{ property?.propertyType ?? '—' }}</dd>
              <UInput v-else v-model="draft.propertyType" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted">Tenure</dt>
              <dd v-if="!editing" class="font-medium text-default capitalize">{{ property?.tenure ? property.tenure.replace(/_/g, ' ') + (property.leaseYearsRemaining ? ` · ${property.leaseYearsRemaining}y left` : '') : '—' }}</dd>
              <select
                v-else
                v-model="draft.tenure"
                class="w-full rounded-md border border-default bg-default px-2 py-1 text-sm capitalize"
              >
                <option :value="null">—</option>
                <option value="freehold">Freehold</option>
                <option value="leasehold">Leasehold</option>
                <option value="share_of_freehold">Share of freehold</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div v-if="!editing || draft.tenure === 'leasehold'">
              <dt class="text-xs text-muted">Lease years</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.leaseYearsRemaining ?? '—' }}</dd>
              <UInput v-else v-model.number="draft.leaseYearsRemaining" type="number" size="sm" />
            </div>
            <div>
              <dt class="text-xs text-muted">Service charge</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.serviceChargeAnnual ? `${formatGBP(property.serviceChargeAnnual)}/yr` : '—' }}</dd>
              <UInput v-else v-model.number="draft.serviceChargeAnnual" type="number" size="sm" placeholder="£/yr" />
            </div>
            <div>
              <dt class="text-xs text-muted">Ground rent</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.groundRentAnnual ? `${formatGBP(property.groundRentAnnual)}/yr` : '—' }}</dd>
              <UInput v-else v-model.number="draft.groundRentAnnual" type="number" size="sm" placeholder="£/yr" />
            </div>
            <div>
              <dt class="text-xs text-muted">Council tax</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.councilTaxBand ? `Band ${property.councilTaxBand}` : '—' }}</dd>
              <UInput v-else v-model="draft.councilTaxBand" size="sm" placeholder="e.g. D" />
            </div>
            <div>
              <dt class="text-xs text-muted">EPC</dt>
              <dd v-if="!editing" class="font-medium text-default">{{ property?.epcCurrent ?? '—' }}</dd>
              <UInput v-else v-model="draft.epcCurrent" size="sm" placeholder="e.g. C" />
            </div>
          </dl>
        </UCard>

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

        <!-- Value -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span>Value</span>
              <UButton
                size="xs"
                variant="outline"
                icon="i-lucide-pound-sterling"
                label="Estimate"
                :loading="valueLoading"
                @click="estimateValue"
              />
            </div>
          </template>
          <ValueVerdict :result="value" :loading="valueLoading" />
        </UCard>

        <!-- Yield (investment) -->
        <UCard>
          <template #header>
            <span class="flex items-center gap-2"><UIcon name="i-lucide-trending-up" class="size-4" /> Yield (investment)</span>
          </template>
          <YieldPanel :property-id="id" />
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

        <!-- Area insights (enrichment) -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span>Area insights</span>
              <UButton
                size="xs"
                variant="outline"
                icon="i-lucide-refresh-cw"
                :loading="enriching"
                label="Refresh"
                @click="runEnrich"
              />
            </div>
          </template>
          <p class="text-xs text-muted">
            Stations (TfL), crime (police.uk), flood risk (Environment Agency) and EPC — free
            official data, cached locally.
          </p>
        </UCard>
        <EnrichmentStationsPanel :entry="enrichment?.transit" />
        <EnrichmentCommutePanel :entry="enrichment?.tfl" />
        <EnrichmentCrimePanel :entry="enrichment?.police" />
        <EnrichmentFloodPanel :entry="enrichment?.flood" />
        <EnrichmentEpcPanel :entry="enrichment?.epc" />

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

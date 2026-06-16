<script setup lang="ts">
useHead({ title: 'Add property · London House-Hunt' })

const config = useRuntimeConfig()
const base = (config.public.appBaseUrl as string) || 'http://localhost:3000'

type Mode = 'url' | 'bookmarklet' | 'manual'
const mode = ref<Mode>('url')
const modes: { key: Mode; label: string; icon: string }[] = [
  { key: 'url', label: 'Paste a link', icon: 'i-lucide-link' },
  { key: 'bookmarklet', label: 'Bookmarklet', icon: 'i-lucide-bookmark' },
  { key: 'manual', label: 'Manual / paste text', icon: 'i-lucide-pencil' },
]

// --- URL import ---
const url = ref('')
const urlError = ref('')
const urlLoading = ref(false)
async function importUrl() {
  urlError.value = ''
  urlLoading.value = true
  try {
    const { id } = await $fetch<{ id: string }>('/api/properties/import', {
      method: 'POST',
      body: { url: url.value },
    })
    await navigateTo(`/properties/${id}`)
  } catch (e: any) {
    urlError.value = e?.data?.statusMessage ?? e?.statusMessage ?? 'Import failed. Try the bookmarklet or manual entry.'
  } finally {
    urlLoading.value = false
  }
}

// --- Bookmarklet (javascript: link built with the app base URL) ---
const bookmarklet = computed(
  () =>
    `javascript:(function(){var p=null,d=null;if(window.PAGE_MODEL){p='rightmove';d=window.PAGE_MODEL;}else{var s=document.getElementById('__NEXT_DATA__');if(s){p='zoopla';try{d=JSON.parse(s.textContent);}catch(e){}}}if(!d){alert('No listing data found on this page.');return;}fetch('${base}/api/properties/import-bookmarklet',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({portal:p,data:d,url:location.href})}).then(function(r){return r.json();}).then(function(j){if(j&&j.id){if(confirm('Saved to House-Hunt. Open it?'))location.href='${base}/properties/'+j.id;}else alert('Import failed.');}).catch(function(){alert('Could not reach the House-Hunt app.');});})();`,
)

// --- Manual / paste-text ---
const form = reactive<Record<string, string>>({
  displayAddress: '',
  postcode: '',
  price: '',
  beds: '',
  baths: '',
  receptions: '',
  floorAreaSqft: '',
  propertyType: '',
  tenure: '',
  leaseYearsRemaining: '',
  serviceChargeAnnual: '',
  groundRentAnnual: '',
  councilTaxBand: '',
  epcCurrent: '',
  description: '',
  sourceUrl: '',
})
const pasteText = ref('')
const manualError = ref('')
const manualLoading = ref(false)

async function extractFromText() {
  if (!pasteText.value.trim()) return
  const fields = await $fetch<Record<string, unknown>>('/api/import/parse-text', {
    method: 'POST',
    body: { text: pasteText.value },
  })
  for (const [k, v] of Object.entries(fields)) {
    if (v != null && k in form) form[k] = String(v)
  }
}

function numOrUndef(v?: string) {
  if (v == null) return undefined
  const n = Number(v)
  return v.trim() !== '' && Number.isFinite(n) ? Math.round(n) : undefined
}
function strOrUndef(v?: string) {
  return v && v.trim() !== '' ? v : undefined
}

async function saveManual() {
  manualError.value = ''
  manualLoading.value = true
  try {
    const body = {
      source: 'manual',
      displayAddress: strOrUndef(form.displayAddress),
      postcode: strOrUndef(form.postcode),
      price: numOrUndef(form.price),
      beds: numOrUndef(form.beds),
      baths: numOrUndef(form.baths),
      receptions: numOrUndef(form.receptions),
      floorAreaSqft: numOrUndef(form.floorAreaSqft),
      propertyType: strOrUndef(form.propertyType),
      tenure: strOrUndef(form.tenure),
      leaseYearsRemaining: numOrUndef(form.leaseYearsRemaining),
      serviceChargeAnnual: numOrUndef(form.serviceChargeAnnual),
      groundRentAnnual: numOrUndef(form.groundRentAnnual),
      councilTaxBand: strOrUndef(form.councilTaxBand),
      epcCurrent: strOrUndef(form.epcCurrent),
      description: strOrUndef(form.description),
      sourceUrl: strOrUndef(form.sourceUrl),
      photos: [],
      floorplans: [],
      stations: [],
    }
    const { id } = await $fetch<{ id: string }>('/api/properties/manual', { method: 'POST', body })
    await navigateTo(`/properties/${id}`)
  } catch (e: any) {
    manualError.value = e?.data?.statusMessage ?? e?.statusMessage ?? 'Could not save. Check the fields and try again.'
  } finally {
    manualLoading.value = false
  }
}

const numberFields = [
  { key: 'price', label: 'Price (£)' },
  { key: 'beds', label: 'Bedrooms' },
  { key: 'baths', label: 'Bathrooms' },
  { key: 'receptions', label: 'Receptions' },
  { key: 'floorAreaSqft', label: 'Floor area (sq ft)' },
  { key: 'leaseYearsRemaining', label: 'Lease years remaining' },
  { key: 'serviceChargeAnnual', label: 'Service charge (£/yr)' },
  { key: 'groundRentAnnual', label: 'Ground rent (£/yr)' },
]
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-bold text-highlighted mb-4">Add a property</h1>

    <div class="flex gap-2 mb-6">
      <UButton
        v-for="m in modes"
        :key="m.key"
        :icon="m.icon"
        :label="m.label"
        :color="mode === m.key ? 'primary' : 'neutral'"
        :variant="mode === m.key ? 'solid' : 'outline'"
        @click="mode = m.key"
      />
    </div>

    <!-- URL -->
    <UCard v-if="mode === 'url'">
      <template #header>Paste a Rightmove or Zoopla link</template>
      <div class="space-y-3">
        <UInput
          v-model="url"
          placeholder="https://www.rightmove.co.uk/properties/123456789"
          icon="i-lucide-link"
          size="lg"
          class="w-full"
        />
        <p v-if="urlError" class="text-sm text-error">{{ urlError }}</p>
        <p class="text-xs text-muted">
          Fetches the page server-side. If a portal blocks it, use the bookmarklet or manual entry.
        </p>
        <UButton
          label="Import"
          icon="i-lucide-download"
          :loading="urlLoading"
          :disabled="!url"
          @click="importUrl"
        />
      </div>
    </UCard>

    <!-- Bookmarklet -->
    <UCard v-else-if="mode === 'bookmarklet'">
      <template #header>One-click bookmarklet</template>
      <div class="space-y-4 text-sm">
        <p>
          Drag this button to your bookmarks bar. Then, while viewing any Rightmove or Zoopla
          listing, click it — it reads the page already loaded in your browser and saves it here.
        </p>
        <a
          :href="bookmarklet"
          class="inline-flex items-center gap-2 rounded-md bg-primary text-inverted px-3 py-2 font-medium"
          @click.prevent
        >
          <UIcon name="i-lucide-bookmark" class="size-4" />
          Save to House-Hunt
        </a>
        <p class="text-xs text-muted">
          (Clicking it here does nothing — drag it to the bookmarks bar.)
        </p>
      </div>
    </UCard>

    <!-- Manual -->
    <UCard v-else>
      <template #header>Enter details manually</template>
      <div class="space-y-5">
        <div>
          <label class="text-sm font-medium text-default">Paste listing text to pre-fill (optional)</label>
          <UTextarea v-model="pasteText" :rows="3" class="w-full mt-1" placeholder="Paste the listing description / details here…" />
          <UButton
            class="mt-2"
            size="sm"
            variant="outline"
            icon="i-lucide-wand-2"
            label="Extract fields"
            :disabled="!pasteText.trim()"
            @click="extractFromText"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <label class="text-sm text-muted">Address</label>
            <UInput v-model="form.displayAddress" class="w-full mt-1" />
          </div>
          <div>
            <label class="text-sm text-muted">Postcode</label>
            <UInput v-model="form.postcode" class="w-full mt-1" placeholder="SW11 2AB" />
          </div>
          <div>
            <label class="text-sm text-muted">Property type</label>
            <UInput v-model="form.propertyType" class="w-full mt-1" placeholder="Flat" />
          </div>
          <div v-for="f in numberFields" :key="f.key">
            <label class="text-sm text-muted">{{ f.label }}</label>
            <UInput v-model="form[f.key]" type="number" class="w-full mt-1" />
          </div>
          <div>
            <label class="text-sm text-muted">Tenure</label>
            <select
              v-model="form.tenure"
              class="w-full mt-1 rounded-md border border-default bg-default px-3 py-1.5 text-sm"
            >
              <option value="">—</option>
              <option value="freehold">Freehold</option>
              <option value="leasehold">Leasehold</option>
              <option value="share_of_freehold">Share of freehold</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-muted">Council tax band</label>
            <UInput v-model="form.councilTaxBand" class="w-full mt-1" placeholder="D" />
          </div>
          <div>
            <label class="text-sm text-muted">EPC rating</label>
            <UInput v-model="form.epcCurrent" class="w-full mt-1" placeholder="C" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-sm text-muted">Source URL (optional)</label>
            <UInput v-model="form.sourceUrl" class="w-full mt-1" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-sm text-muted">Description</label>
            <UTextarea v-model="form.description" :rows="3" class="w-full mt-1" />
          </div>
        </div>

        <p v-if="manualError" class="text-sm text-error">{{ manualError }}</p>
        <UButton label="Save property" icon="i-lucide-save" :loading="manualLoading" @click="saveManual" />
      </div>
    </UCard>
  </div>
</template>

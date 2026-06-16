<script setup lang="ts">
interface YieldResult {
  hasRent: boolean
  monthlyRent?: number
  annualRent?: number
  grossYield?: number
  netYield?: number
  netOperatingIncome?: number
  investmentScore?: number
  costs?: { voids: number; management: number; maintenance: number; serviceCharge: number; groundRent: number }
}
const props = defineProps<{ propertyId: string }>()

const monthlyRent = ref<number | null>(null)
const result = ref<YieldResult | null>(null)
const loading = ref(false)

const { data } = await useFetch<YieldResult>(`/api/properties/${props.propertyId}/yield`, {
  default: () => ({ hasRent: false }),
})
if (data.value?.hasRent) {
  result.value = data.value
  monthlyRent.value = data.value.monthlyRent ?? null
}

async function calc() {
  if (!monthlyRent.value) return
  loading.value = true
  try {
    result.value = await $fetch<YieldResult>(`/api/properties/${props.propertyId}/yield`, {
      method: 'POST',
      body: { monthlyRent: monthlyRent.value },
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2 items-end">
      <div class="flex-1">
        <label class="text-xs text-muted">Expected rent (£/month)</label>
        <UInput v-model.number="monthlyRent" type="number" class="w-full mt-1" placeholder="2200" />
      </div>
      <UButton label="Calculate" icon="i-lucide-percent" :loading="loading" :disabled="!monthlyRent" @click="calc" />
    </div>

    <div v-if="result?.hasRent" class="text-sm">
      <div class="flex gap-8">
        <div>
          <span class="text-2xl font-bold text-highlighted">{{ result.grossYield }}%</span>
          <p class="text-xs text-muted">gross yield</p>
        </div>
        <div>
          <span class="text-2xl font-bold text-highlighted">{{ result.netYield }}%</span>
          <p class="text-xs text-muted">net yield</p>
        </div>
      </div>
      <ul class="mt-3 text-xs text-muted space-y-0.5">
        <li>Annual rent: {{ formatGBP(result.annualRent) }}</li>
        <li>Net operating income: {{ formatGBP(result.netOperatingIncome) }}</li>
        <li v-if="result.costs">
          Costs — voids {{ formatGBP(result.costs.voids) }}, maintenance {{ formatGBP(result.costs.maintenance) }},
          service charge {{ formatGBP(result.costs.serviceCharge) }}, ground rent {{ formatGBP(result.costs.groundRent) }}
        </li>
      </ul>
      <p class="text-xs text-dimmed mt-1">
        Net assumes ~5% voids, 1%/yr maintenance, self-managed. Enter rent from comparable lettings.
      </p>
    </div>
    <p v-else class="text-sm text-muted">Enter an expected monthly rent to estimate the yield.</p>
  </div>
</template>

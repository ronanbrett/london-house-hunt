// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import WeightsPage from '~/pages/settings/profiles.vue'

registerEndpoint('/api/metrics', () => [
  { key: 'value', label: 'Value for money', category: 'value', defaultWeight: 8 },
  { key: 'commute', label: 'Commute', category: 'commute', defaultWeight: 7 },
])
registerEndpoint('/api/profile/weights', () => ({ weights: { value: 10 } }))

describe('weights page', () => {
  it('renders a slider per metric showing saved + default weights', async () => {
    const wrapper = await mountSuspended(WeightsPage)
    const text = wrapper.text()
    expect(text).toContain('Value for money')
    expect(text).toContain('Commute')
    expect(wrapper.findAll('input[type="range"]').length).toBe(2)
  })
})

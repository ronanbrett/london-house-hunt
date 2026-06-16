// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import YieldPanel from '~/components/yield/YieldPanel.vue'

registerEndpoint('/api/properties/has-rent/yield', () => ({
  hasRent: true,
  monthlyRent: 2000,
  annualRent: 24000,
  grossYield: 4.8,
  netYield: 3.6,
  netOperatingIncome: 17800,
  investmentScore: 37,
  costs: { voids: 1200, management: 0, maintenance: 5000, serviceCharge: 0, groundRent: 0 },
}))
registerEndpoint('/api/properties/no-rent/yield', () => ({ hasRent: false }))

describe('YieldPanel', () => {
  it('shows gross and net yield when rent is set', async () => {
    const wrapper = await mountSuspended(YieldPanel, { props: { propertyId: 'has-rent' } })
    const text = wrapper.text()
    expect(text).toContain('4.8%')
    expect(text).toContain('3.6%')
  })

  it('prompts for rent when none is set', async () => {
    const wrapper = await mountSuspended(YieldPanel, { props: { propertyId: 'no-rent' } })
    expect(wrapper.text()).toContain('Enter an expected monthly rent')
  })
})

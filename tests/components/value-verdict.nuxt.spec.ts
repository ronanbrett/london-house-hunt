// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ValueVerdict from '~/components/value/ValueVerdict.vue'

describe('ValueVerdict', () => {
  it('renders the verdict, fair value and sample size', async () => {
    const wrapper = await mountSuspended(ValueVerdict, {
      props: {
        result: {
          sampleSize: 14,
          fairValue: 525000,
          fairValueLow: 500000,
          fairValueHigh: 560000,
          deltaPct: 0.05,
          verdict: 'slightly_above',
          valueScore: 60,
          hpiAdjusted: false,
          comps: [{ amount: 530000, date: '2025-03-01', propertyType: 'flat-maisonette' }],
        },
      },
    })
    const text = wrapper.text()
    expect(text).toContain('Slightly above market')
    expect(text).toContain('£525,000')
    expect(text).toContain('14 recent')
  })

  it('prompts to estimate when there is no result', async () => {
    const wrapper = await mountSuspended(ValueVerdict, { props: { result: null } })
    expect(wrapper.text()).toContain("Estimate this property's value")
  })
})

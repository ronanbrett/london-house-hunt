// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CrimePanel from '~/components/enrichment/CrimePanel.vue'

describe('CrimePanel', () => {
  it('renders totals and humanised categories', async () => {
    const wrapper = await mountSuspended(CrimePanel, {
      props: {
        entry: {
          status: 'ok',
          derived: {
            month: '2026-01',
            total: 12,
            byCategory: [
              { category: 'anti-social-behaviour', count: 7 },
              { category: 'burglary', count: 5 },
            ],
          },
        },
      },
    })
    const text = wrapper.text()
    expect(text).toContain('12')
    expect(text).toContain('Anti social behaviour')
    expect(text).toContain('Burglary')
  })

  it('shows an empty state without an entry', async () => {
    const wrapper = await mountSuspended(CrimePanel, { props: { entry: null } })
    expect(wrapper.text()).toContain('No crime data loaded')
  })
})

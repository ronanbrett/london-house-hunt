// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ScorePanel from '~/components/score/ScorePanel.vue'

describe('ScorePanel', () => {
  it('shows the total, confidence and per-metric contributions', async () => {
    const wrapper = await mountSuspended(ScorePanel, {
      props: {
        score: {
          total: 72,
          confidence: 0.8,
          contributions: [
            { key: 'commute', label: 'Commute', category: 'commute', normalized: 65, weight: 7, missing: false },
            { key: 'epc', label: 'Energy (EPC)', category: 'energy', normalized: 50, weight: 4, missing: true },
          ],
        },
      },
    })
    const text = wrapper.text()
    expect(text).toContain('72')
    expect(text).toContain('80% confidence')
    expect(text).toContain('Commute')
    expect(text).toContain('Energy (EPC)')
    expect(text).toContain('no data')
  })

  it('shows a placeholder without a score', async () => {
    const wrapper = await mountSuspended(ScorePanel, { props: { score: null } })
    expect(wrapper.text()).toContain('No score yet')
  })
})

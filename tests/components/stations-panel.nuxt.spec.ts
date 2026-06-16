// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import StationsPanel from '~/components/enrichment/StationsPanel.vue'

describe('StationsPanel', () => {
  it('lists stations with modes and distance', async () => {
    const wrapper = await mountSuspended(StationsPanel, {
      props: {
        entry: {
          status: 'ok',
          derived: {
            stations: [{ name: 'Clapham Junction', modes: ['national-rail', 'overground'], distanceMiles: 0.3 }],
          },
        },
      },
    })
    const text = wrapper.text()
    expect(text).toContain('Clapham Junction')
    expect(text).toContain('Rail')
    expect(text).toContain('Overground')
    expect(text).toContain('0.3 mi')
  })

  it('shows an empty state without data', async () => {
    const wrapper = await mountSuspended(StationsPanel, { props: { entry: null } })
    expect(wrapper.text()).toContain('No station data loaded')
  })
})

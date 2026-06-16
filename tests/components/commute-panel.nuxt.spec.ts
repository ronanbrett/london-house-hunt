// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CommutePanel from '~/components/enrichment/CommutePanel.vue'

describe('CommutePanel', () => {
  it('shows the weighted average and per-destination times', async () => {
    const wrapper = await mountSuspended(CommutePanel, {
      props: {
        entry: {
          status: 'ok',
          derived: {
            blendedMinutes: 32,
            destinations: [{ destinationId: 'd1', label: 'Work', minutes: 30, mode: 'transit' }],
          },
        },
      },
    })
    const text = wrapper.text()
    expect(text).toContain('32')
    expect(text).toContain('Work')
    expect(text).toContain('30 min')
  })

  it('prompts to add destinations when none are set', async () => {
    const wrapper = await mountSuspended(CommutePanel, {
      props: { entry: { status: 'ok', derived: { blendedMinutes: null, destinations: [] } } },
    })
    expect(wrapper.text()).toContain('No destinations set')
  })
})

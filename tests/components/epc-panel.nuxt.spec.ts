// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EpcPanel from '~/components/enrichment/EpcPanel.vue'

describe('EpcPanel', () => {
  it('shows the rating and floor area', async () => {
    const wrapper = await mountSuspended(EpcPanel, {
      props: { entry: { status: 'ok', derived: { current: 'C', potential: 'B', floorAreaSqft: 720 } } },
    })
    const text = wrapper.text()
    expect(text).toContain('C')
    expect(text).toContain('720')
  })

  it('shows a no-match hint', async () => {
    const wrapper = await mountSuspended(EpcPanel, { props: { entry: { status: 'no_match', derived: null } } })
    expect(wrapper.text()).toContain('No EPC matched')
  })
})

// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ComparePage from '~/pages/compare.vue'

registerEndpoint('/api/properties', () => [
  { id: 'a', displayAddress: '1 A Road', price: 500000 },
  { id: 'b', displayAddress: '2 B Road', price: 600000 },
])

describe('compare page', () => {
  it('prompts to select properties when fewer than two are chosen', async () => {
    const wrapper = await mountSuspended(ComparePage)
    expect(wrapper.text()).toContain('Select at least two properties')
    expect(wrapper.text()).toContain('1 A Road')
  })
})

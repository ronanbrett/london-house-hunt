// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('dashboard page', () => {
  it('renders the empty state with a call to add a property', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const text = wrapper.text()
    expect(text).toContain('No properties yet')
    expect(text).toContain('Add property')
  })
})

// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ImportPage from '~/pages/import.vue'

describe('import page', () => {
  it('shows the three import modes with the URL field by default', async () => {
    const wrapper = await mountSuspended(ImportPage)
    const text = wrapper.text()
    expect(text).toContain('Paste a link')
    expect(text).toContain('Bookmarklet')
    expect(text).toContain('Manual / paste text')
    expect(text).toContain('Paste a Rightmove or Zoopla link')
  })
})

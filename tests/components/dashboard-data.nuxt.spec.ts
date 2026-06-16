// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

registerEndpoint('/api/properties', () => [
  {
    id: 'p1',
    status: 'shortlisted',
    displayAddress: '1 Test Street, London',
    postcode: 'SW11 2AB',
    price: 750000,
    beds: 2,
    baths: 1,
    floorAreaSqft: 750,
    thumbnail: null,
  },
])
registerEndpoint('/api/properties/scores', () => ({ p1: { total: 82, confidence: 0.9 } }))

describe('dashboard with data', () => {
  it('renders a property card with address, price, status and score', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const text = wrapper.text()
    expect(text).toContain('1 Test Street, London')
    expect(text).toContain('£750,000')
    expect(text).toContain('shortlisted')
    expect(text).toContain('82') // score badge
  })
})

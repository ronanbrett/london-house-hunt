// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DetailPage from '~/pages/properties/[id].vue'

registerEndpoint('/api/properties/abc', () => ({
  property: {
    id: 'abc',
    status: 'active',
    displayAddress: '5 Demo Road',
    postcode: 'SW2 1AA',
    price: 500000,
    beds: 3,
    baths: 2,
    floorAreaSqft: 1000,
    lat: null, // null so the (client-only, WebGL) map is not rendered in tests
    lng: null,
    tenure: 'freehold',
    description: 'Lovely home',
  },
  photos: [],
  floorplans: [],
  stations: [],
  notes: [],
}))

describe('property detail', () => {
  it('renders the fetched property facts', async () => {
    const wrapper = await mountSuspended(DetailPage, { route: '/properties/abc' })
    const text = wrapper.text()
    expect(text).toContain('5 Demo Road')
    expect(text).toContain('£500,000')
    expect(text).toContain('Key facts')
  })
})

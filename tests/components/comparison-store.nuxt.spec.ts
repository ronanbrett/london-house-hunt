// @vitest-environment nuxt
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useComparisonStore } from '~/stores/comparison'

describe('comparison store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('toggles, reports membership, and clears', () => {
    const s = useComparisonStore()
    expect(s.ids).toEqual([])
    s.toggle('a')
    s.toggle('b')
    expect(s.ids).toEqual(['a', 'b'])
    expect(s.has('a')).toBe(true)
    s.toggle('a')
    expect(s.ids).toEqual(['b'])
    s.clear()
    expect(s.ids).toEqual([])
  })
})

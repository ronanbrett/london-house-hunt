import { defineStore } from 'pinia'

/** Which saved properties are currently selected for side-by-side comparison. */
export const useComparisonStore = defineStore('comparison', () => {
  const ids = ref<string[]>([])

  function toggle(id: string) {
    const i = ids.value.indexOf(id)
    if (i >= 0) ids.value.splice(i, 1)
    else ids.value.push(id)
  }
  const has = (id: string) => ids.value.includes(id)
  function clear() {
    ids.value = []
  }

  return { ids, toggle, has, clear }
})

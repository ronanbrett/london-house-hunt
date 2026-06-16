<script setup lang="ts">
// maplibre-gl is imported dynamically inside onMounted so its module code never runs during
// SSR or in tests where the map isn't actually mounted.
const props = defineProps<{ lat: number; lng: number }>()
const el = ref<HTMLElement | null>(null)
let map: { remove: () => void } | null = null

onMounted(async () => {
  if (!el.value) return
  const { default: maplibregl } = await import('maplibre-gl')
  await import('maplibre-gl/dist/maplibre-gl.css')

  map = new maplibregl.Map({
    container: el.value,
    // Keyless OpenStreetMap raster tiles (no MapTiler key required).
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: [props.lng, props.lat],
    zoom: 14,
  })
  new maplibregl.Marker().setLngLat([props.lng, props.lat]).addTo(map as never)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="h-64 w-full rounded-lg overflow-hidden border border-default" />
</template>

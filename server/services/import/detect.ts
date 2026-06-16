export type DetectedPortal = 'rightmove' | 'zoopla' | 'unknown'

/** Classify a listing URL by portal. */
export function detectPortal(url: string): DetectedPortal {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'unknown'
  }
  if (host.includes('rightmove.co.uk')) return 'rightmove'
  if (host.includes('zoopla.co.uk')) return 'zoopla'
  return 'unknown'
}

/** Pull the portal's numeric listing id out of a URL, when present. */
export function extractListingId(url: string, portal: DetectedPortal): string | undefined {
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch {
    return undefined
  }
  if (portal === 'rightmove') return pathname.match(/\/properties\/(\d+)/)?.[1]
  if (portal === 'zoopla') return pathname.match(/\/details\/(\d+)/)?.[1]
  return undefined
}

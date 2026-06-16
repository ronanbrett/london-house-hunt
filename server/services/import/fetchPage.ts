import pRetry from 'p-retry'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/**
 * Fetch a listing page's HTML with a realistic UA, timeout and a couple of retries.
 * Used only by the server-fetch import path (the bookmarklet sends data directly).
 */
export async function fetchPage(url: string, timeoutMs = 15000): Promise<string> {
  return pRetry(
    async () => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      return await res.text()
    },
    { retries: 2, minTimeout: 500 },
  )
}

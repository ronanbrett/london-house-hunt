import pRetry from 'p-retry'

const lastCallAt = new Map<string, number>()

/** Per-host minimum-gap limiter (single-user app — keeps us polite to free APIs). */
export async function rateLimit(host: string, minGapMs = 250): Promise<void> {
  const now = Date.now()
  const earliest = (lastCallAt.get(host) ?? 0) + minGapMs
  const wait = Math.max(0, earliest - now)
  lastCallAt.set(host, now + wait)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
}

/** GET JSON with rate-limit, timeout and retry. Throws on non-2xx (cache turns this into a status). */
export async function fetchJson<T>(
  url: string,
  opts: { timeoutMs?: number; retries?: number; headers?: Record<string, string> } = {},
): Promise<T> {
  const host = new URL(url).host
  return pRetry(
    async () => {
      await rateLimit(host)
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...opts.headers },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return (await res.json()) as T
    },
    { retries: opts.retries ?? 2, minTimeout: 300 },
  )
}

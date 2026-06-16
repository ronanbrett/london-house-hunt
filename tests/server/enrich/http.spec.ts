import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '../../../server/services/enrich/http'

afterEach(() => vi.restoreAllMocks())

describe('fetchJson', () => {
  it('returns parsed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })))
    expect(await fetchJson('https://x.test/a')).toEqual({ ok: true })
  })

  it('throws on non-2xx after retrying', async () => {
    const f = vi.fn(async () => new Response('no', { status: 500 }))
    vi.stubGlobal('fetch', f)
    await expect(fetchJson('https://x.test/a', { retries: 1 })).rejects.toThrow()
    expect(f).toHaveBeenCalledTimes(2) // initial + 1 retry
  })
})

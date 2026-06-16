import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPage } from '../../../server/services/import/fetchPage'

afterEach(() => vi.restoreAllMocks())

describe('fetchPage', () => {
  it('returns the response body text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>ok</html>', { status: 200 })),
    )
    expect(await fetchPage('https://example.com')).toContain('ok')
  })

  it('retries then throws on persistent failure', async () => {
    const f = vi.fn(async () => new Response('no', { status: 500 }))
    vi.stubGlobal('fetch', f)
    await expect(fetchPage('https://example.com')).rejects.toThrow()
    expect(f).toHaveBeenCalledTimes(3) // initial + 2 retries
  })
})

import { parse as parseHtml } from 'node-html-parser'

/**
 * Extract a JS object literal assigned after `marker`, e.g. the `{...}` in
 * `window.PAGE_MODEL = {...};`. Uses brace-matching that respects string literals, so it
 * stops at the correct closing brace rather than a naive regex. Returns the JSON string.
 */
export function extractAssignedObject(source: string, marker: string): string | null {
  const markerIdx = source.indexOf(marker)
  if (markerIdx === -1) return null
  const start = source.indexOf('{', markerIdx)
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  let quote = ''
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) inString = false
    } else if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return null
}

/** Parse the JSON embedded in a Next.js `<script id="__NEXT_DATA__">` tag. */
export function extractNextData(html: string): unknown | null {
  const root = parseHtml(html)
  const el = root.querySelector('script#__NEXT_DATA__')
  if (!el) return null
  try {
    return JSON.parse(el.text)
  } catch {
    return null
  }
}

/**
 * Rightmove now encodes PAGE_MODEL with devalue (reference-based serialisation).
 * The shape is `{data: "[...]", encoding: "on"}` where `data` is a JSON array of
 * nodes. Values in objects/arrays are indices into that array; primitives are leaves.
 */
export function devalueUnflatten(raw: unknown): unknown | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (obj.encoding !== 'on' || typeof obj.data !== 'string') return null

  let flat: unknown[]
  try {
    flat = JSON.parse(obj.data as string)
  } catch {
    return null
  }
  if (!Array.isArray(flat) || flat.length === 0) return null

  const hydrated = new Array<unknown>(flat.length)
  const objectIndices: number[] = []

  for (let i = 0; i < flat.length; i++) {
    const v = flat[i]
    if (v && typeof v === 'object') {
      hydrated[i] = Array.isArray(v) ? [...v] : { ...v }
      objectIndices.push(i)
    } else {
      hydrated[i] = v
    }
  }

  for (const i of objectIndices) {
    const node = hydrated[i]
    if (Array.isArray(node)) {
      for (let j = 0; j < node.length; j++) {
        const v = node[j]
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < flat.length) {
          node[j] = hydrated[v]
        }
      }
    } else {
      const rec = node as Record<string, unknown>
      for (const k of Object.keys(rec)) {
        const v = rec[k]
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < flat.length) {
          rec[k] = hydrated[v]
        }
      }
    }
  }

  return hydrated[0]
}

/** Extract the Zoopla `__ZAD_TARGETING__` ad-targeting JSON embedded in a script tag. */
export function extractZooplaTargeting(html: string): Record<string, unknown> | null {
  const root = parseHtml(html)
  const el = root.querySelector('script#__ZAD_TARGETING__')
  if (!el) return null
  try {
    const data = JSON.parse(el.text)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

/** Extract the first JSON-LD block with the given `@type` from HTML. */
export function extractJsonLd(html: string, type: string): Record<string, unknown> | null {
  const root = parseHtml(html)
  const scripts = root.querySelectorAll('script[type="application/ld+json"]')
  for (const el of scripts) {
    try {
      const data = JSON.parse(el.text)
      if (data?.['@type'] === type) return data
    } catch {
      continue
    }
  }
  return null
}

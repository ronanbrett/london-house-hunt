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

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import type { AppDatabase } from '../../server/db/client'
import * as schema from '../../server/db/schema'

/**
 * Build a fresh in-memory SQLite DB with all generated migrations applied.
 * Use in tests that exercise persistence: `const db = await makeTestDb()`.
 */
export async function makeTestDb(): Promise<AppDatabase> {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')

  const dir = join(process.cwd(), 'server/db/migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const f of files) {
    await client.executeMultiple(readFileSync(join(dir, f), 'utf8'))
  }

  return drizzle(client, { schema })
}

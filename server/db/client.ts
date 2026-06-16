import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

/**
 * Returns the shared Drizzle/libsql client (single-user, local SQLite file).
 * Lazily initialised; foreign keys enabled so cascade deletes work.
 */
export function useDb() {
  if (!_db) {
    const url = process.env.NUXT_DB_URL ?? 'file:./data/app.db'
    const client = createClient({ url })
    // SQLite has FKs off by default; needed for onDelete cascade.
    void client.execute('PRAGMA foreign_keys = ON')
    _db = drizzle(client, { schema })
  }
  return _db
}

export { schema }

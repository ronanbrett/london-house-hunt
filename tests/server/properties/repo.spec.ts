import { describe, expect, it } from 'vitest'
import { CanonicalListingSchema } from '../../../shared/types/canonical'
import { persistListing } from '../../../server/services/import/persist'
import {
  addNote,
  deleteProperty,
  getProperty,
  listProperties,
  updateStatus,
} from '../../../server/services/properties/repo'
import { makeTestDb } from '../../helpers/testDb'

const base = (o: Record<string, unknown> = {}) =>
  CanonicalListingSchema.parse({
    source: 'manual',
    displayAddress: 'A',
    postcode: 'SW11 2AB',
    lat: 1,
    lng: 2,
    price: 100000,
    photos: [{ kind: 'photo', url: 'https://x/1.jpg' }],
    floorplans: [],
    stations: [],
    ...o,
  })

describe('properties repo', () => {
  it('lists with a thumbnail, returns the bundle, notes, status and delete', async () => {
    const db = await makeTestDb()
    const id = await persistListing(base(), db)

    const list = await listProperties(db)
    expect(list).toHaveLength(1)
    expect(list[0].thumbnail).toBe('https://x/1.jpg')

    const bundle = await getProperty(id, db)
    expect(bundle?.property.id).toBe(id)
    expect(bundle?.photos).toHaveLength(1)

    await addNote(id, 'Nice kitchen', db)
    expect((await getProperty(id, db))?.notes).toHaveLength(1)

    expect(await updateStatus(id, 'shortlisted', db)).toBe(true)
    expect((await getProperty(id, db))?.property.status).toBe('shortlisted')

    expect(await deleteProperty(id, db)).toBe(true)
    expect(await getProperty(id, db)).toBeNull()
  })

  it('getProperty returns null for an unknown id', async () => {
    const db = await makeTestDb()
    expect(await getProperty('nope', db)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  createDestination,
  deleteDestination,
  listDestinations,
} from '../../../server/services/destinations/repo'
import { makeTestDb } from '../../helpers/testDb'

describe('destinations repo', () => {
  it('creates, lists (by importance) and deletes', async () => {
    const db = await makeTestDb()
    const work = await createDestination({ label: 'Work', lat: 51.5, lng: -0.1, importance: 5 }, db)
    await createDestination({ label: 'Gym', lat: 51.4, lng: -0.2, importance: 2 }, db)

    const list = await listDestinations(db)
    expect(list.map((d) => d.label)).toEqual(['Work', 'Gym']) // ordered by importance desc

    expect(await deleteDestination(work.id, db)).toBe(true)
    expect((await listDestinations(db)).map((d) => d.label)).toEqual(['Gym'])
  })

  it('defaults mode and importance', async () => {
    const db = await makeTestDb()
    const d = await createDestination({ label: 'X', lat: 1, lng: 2 }, db)
    expect(d.mode).toBe('transit')
    expect(d.importance).toBe(3)
  })
})

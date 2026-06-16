import { z } from 'zod'
import { addNote } from '../../../services/properties/repo'

const Body = z.object({ body: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const { body } = await readValidatedBody(event, Body.parse)
  return addNote(id, body)
})

import { z } from 'zod'
import { parsePastedText } from '../../services/import/parseText'

const Body = z.object({ text: z.string() })

export default defineEventHandler(async (event) => {
  const { text } = await readValidatedBody(event, Body.parse)
  return parsePastedText(text)
})

import { computePropertyYield } from '../../../services/yield/service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  return computePropertyYield(id)
})

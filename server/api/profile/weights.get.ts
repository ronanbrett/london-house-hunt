import { getEffectiveWeights } from '../../services/scoring/profiles'

export default defineEventHandler(async () => ({ weights: await getEffectiveWeights() }))

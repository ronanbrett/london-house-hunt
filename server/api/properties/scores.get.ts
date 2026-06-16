import { scoreAllProperties } from '../../services/scoring/dashboard'

// Static route — resolves before the dynamic `[id].get.ts`.
export default defineEventHandler(() => scoreAllProperties())

import { listDestinations } from '../../services/destinations/repo'

export default defineEventHandler(() => listDestinations())

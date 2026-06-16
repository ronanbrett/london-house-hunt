/** Thrown when an import source can't be parsed into a CanonicalListing. Callers should
 *  catch this and steer the user to the manual-entry fallback. */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportParseError'
  }
}

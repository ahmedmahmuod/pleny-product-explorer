/**
 * Narrows unknown external data to a property-bearing object without making
 * an unsafe type assertion at the call site.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

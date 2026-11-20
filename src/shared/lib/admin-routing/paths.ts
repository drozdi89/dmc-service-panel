/** Base path for all admin routes. */
export const ADMIN_BASE_PATH = '/admin';

/**
 * Builds absolute admin path from a relative segment.
 *
 * @param segment - Path segment without leading slash.
 */
export function adminPath(segment: string): string {
  const normalized = segment.replace(/^\//, '');
  return `${ADMIN_BASE_PATH}/${normalized}`;
}

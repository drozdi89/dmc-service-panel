import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../types/listQuery';

/**
 * Debounces a search string for server-side list queries.
 *
 * @param value - Raw search input value.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns Debounced value suitable for API `q` parameter.
 */
export function useDebouncedSearch(
  value: string,
  delayMs: number = SEARCH_DEBOUNCE_MS,
): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

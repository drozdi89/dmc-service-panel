import { useEffect, useState } from 'react';
import { LOADING_VISIBLE_DELAY_MS } from '../types/listQuery';

/**
 * Delays showing a loading indicator until the operation exceeds the threshold.
 * Prevents flicker on fast responses while meeting the >300ms UX requirement.
 *
 * @param isLoading - Whether an async operation is in progress.
 * @param delayMs - Delay before showing loading state.
 * @returns True when loading indicator should be visible.
 */
export function useDelayedLoading(
  isLoading: boolean,
  delayMs: number = LOADING_VISIBLE_DELAY_MS,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isLoading, delayMs]);

  return visible;
}

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { useDelayedLoading } from './useDelayedLoading';

describe('useDelayedLoading', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading only after delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, 300),
      { initialProps: { loading: true } },
    );

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });
});

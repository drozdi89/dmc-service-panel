import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { useDebouncedSearch } from './useDebouncedSearch';

describe('useDebouncedSearch', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces value updates', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch(value, 300),
      { initialProps: { value: 'a' } },
    );

    expect(result.current).toBe('a');

    rerender({ value: 'abc' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('abc');
  });
});

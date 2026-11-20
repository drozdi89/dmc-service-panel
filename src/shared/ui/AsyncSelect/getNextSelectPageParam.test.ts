import { describe, expect, it } from 'vitest';
import { getNextSelectPageParam } from './getNextSelectPageParam';

describe('getNextSelectPageParam', () => {
  it('returns next page when response length equals requested size', () => {
    expect(getNextSelectPageParam(50, 50, 0)).toBe(1);
  });

  it('returns undefined when response is shorter than requested size', () => {
    expect(getNextSelectPageParam(10, 50, 1)).toBeUndefined();
  });

  it('returns undefined for an empty last page', () => {
    expect(getNextSelectPageParam(0, 50, 2)).toBeUndefined();
  });
});

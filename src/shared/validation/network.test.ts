import { describe, expect, it } from 'vitest';
import { validatePort } from './network';

describe('validatePort', () => {
  it('accepts valid ports', () => {
    expect(validatePort(1)).toBeNull();
    expect(validatePort(65535)).toBeNull();
    expect(validatePort('9100')).toBeNull();
  });

  it('rejects out of range and empty values', () => {
    expect(validatePort(0)).toMatch(/1 до 65535/);
    expect(validatePort(70000)).toMatch(/1 до 65535/);
    expect(validatePort('')).toMatch(/Укажите порт/);
    expect(validatePort(null)).toMatch(/Укажите порт/);
  });

  it('rejects non-integer ports', () => {
    expect(validatePort(9100.5)).toMatch(/1 до 65535/);
    expect(validatePort('abc')).toMatch(/1 до 65535/);
  });
});

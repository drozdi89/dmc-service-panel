import { describe, expect, it } from 'vitest';
import { validateBatchTemplate } from './validateBatchTemplate';

describe('validateBatchTemplate', () => {
  it('accepts empty template', () => {
    expect(validateBatchTemplate('')).toBeNull();
  });

  it('accepts allowed placeholders', () => {
    expect(validateBatchTemplate('{mandate}-{gtin}')).toBeNull();
  });

  it('rejects unknown placeholders', () => {
    expect(validateBatchTemplate('{unknown}')).toBe(
      'Указано некорректное поле в формате шаблона: {unknown}',
    );
  });
});

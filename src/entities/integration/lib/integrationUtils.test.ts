import { describe, expect, it } from 'vitest';
import {
  formatAutoorderAmount,
  formatCrptTemplateIdx,
  formatLineTaskType,
  parseAutoorderAmount,
} from './integrationUtils';

describe('integrationUtils', () => {
  describe('formatAutoorderAmount', () => {
    it('maps special values to Russian labels', () => {
      expect(formatAutoorderAmount(-1)).toBe('Отключить');
      expect(formatAutoorderAmount(0)).toBe('По умолчанию');
      expect(formatAutoorderAmount(1500)).toBe('1500');
    });
  });

  describe('parseAutoorderAmount', () => {
    it('parses labels back to stored integers', () => {
      expect(parseAutoorderAmount('Отключить')).toBe(-1);
      expect(parseAutoorderAmount('Отключен')).toBe(-1);
      expect(parseAutoorderAmount('По умолчанию')).toBe(0);
      expect(parseAutoorderAmount('42')).toBe(42);
    });
  });

  describe('formatCrptTemplateIdx', () => {
    it('distinguishes long and short templates', () => {
      expect(formatCrptTemplateIdx(0)).toBe('Длинный');
      expect(formatCrptTemplateIdx(1)).toBe('Короткий');
    });
  });

  describe('formatLineTaskType', () => {
    it('maps reserve_disabled to KM type labels', () => {
      expect(formatLineTaskType(false)).toBe('Собственные КМ');
      expect(formatLineTaskType(true)).toBe('Напечатанные КМ');
    });
  });
});

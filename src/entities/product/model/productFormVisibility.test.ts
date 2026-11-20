import { describe, expect, it } from 'vitest';
import {
  amountFieldLabel,
  isVsdRequired,
  showsVetControl,
  vetControlLabel,
} from './productFormVisibility';

describe('productFormVisibility', () => {
  it('shows VETIS for vsd_required groups and bio', () => {
    expect(showsVetControl('milk')).toBe(true);
    expect(showsVetControl('bio')).toBe(true);
    expect(showsVetControl('tobacco')).toBe(false);
    expect(isVsdRequired('milk')).toBe(true);
    expect(isVsdRequired('bio')).toBe(false);
  });

  it('uses bio-specific VETIS label', () => {
    expect(vetControlLabel('bio')).toBe('Сырьё подконтрольно ВЕТИС');
    expect(vetControlLabel('milk')).toBe('Продукция подконтрольна ВЕТИС');
  });

  it('labels amount field by measure unit', () => {
    expect(amountFieldLabel('W')).toBe('Вес продукции');
    expect(amountFieldLabel('V')).toBe('Объём продукции');
    expect(amountFieldLabel('U')).toBe('Объём/вес продукции');
  });
});

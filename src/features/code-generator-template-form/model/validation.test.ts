import type { CounterSpecSchema } from '@/entities/code-generator-template';
import { describe, expect, it } from 'vitest';
import {
  isCounterRowFilledWithoutName,
  normalizeCounterConfig,
  validateCodeGeneratorTemplateForm,
} from './validation';

function counter(partial: Partial<CounterSpecSchema> = {}): CounterSpecSchema {
  return {
    name: '',
    width: 6,
    key_fields: [],
    min: 1,
    max: 0,
    ...partial,
  };
}

describe('validateCodeGeneratorTemplateForm', () => {
  it('requires name and non-empty template', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: '  ',
      template: '',
      counter_config: [],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        { name: 'name', message: 'Укажите имя шаблона' },
        { name: 'template', message: 'Заполните строку шаблона' },
      ]),
    );
  });

  it('passes when name, template and counters are valid', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'SSCC',
      template: '00{serial}',
      counter_config: [counter({ name: 'serial', width: 6 })],
    });

    expect(errors).toEqual([]);
  });

  it('rejects digit-only counter name', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'T',
      template: '{a}',
      counter_config: [counter({ name: '12345' })],
    });

    expect(errors.length).toBe(1);
  });

  it('rejects filled counter row without name', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'T',
      template: '{a}',
      counter_config: [counter({ width: 8 })],
    });

    expect(errors).toEqual([
      {
        name: ['counter_config', 0, 'name'],
        message: 'Счётчик в строке 1: укажите имя или очистите строку',
      },
    ]);
  });

  it('rejects duplicate counter names', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'T',
      template: '{a}',
      counter_config: [counter({ name: 'serial' }), counter({ name: 'serial' })],
    });

    expect(errors).toEqual([
      {
        name: ['counter_config', 1, 'name'],
        message: 'Дублирующееся имя счётчика «serial» (строки 1 и 2)',
      },
    ]);
  });

  it('allows empty default counter rows', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'T',
      template: 'plain',
      counter_config: [counter()],
    });

    expect(errors).toEqual([]);
  });
});

describe('isCounterRowFilledWithoutName', () => {
  it('is false for default empty row', () => {
    expect(isCounterRowFilledWithoutName(counter())).toBe(false);
  });

  it('is true when width differs from default', () => {
    expect(isCounterRowFilledWithoutName(counter({ width: 8 }))).toBe(true);
  });
});

describe('normalizeCounterConfig', () => {
  it('drops unnamed rows and trims named ones', () => {
    expect(
      normalizeCounterConfig([
        counter(),
        counter({ name: '  serial  ', key_fields: ['taskid'], width: 8 }),
      ]),
    ).toEqual([
      {
        name: 'serial',
        width: 8,
        key_fields: ['taskid'],
        min: 1,
        max: 0,
      },
    ]);
  });
});
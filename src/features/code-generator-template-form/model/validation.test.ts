import { describe, expect, it } from 'vitest';
import type { CounterSpec } from '@/entities/code-generator-template';
import {
  isCounterRowFilledWithoutName,
  normalizeCounterConfig,
  validateCodeGeneratorTemplateForm,
} from './validation';

function counter(partial: Partial<CounterSpec> = {}): CounterSpec {
  return {
    name: '',
    type: 'task_pack',
    key_template: '',
    format: '06d',
    level_from: 'aggregation_level',
    initial_value: 0,
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
      counter_config: [counter({ name: 'serial', type: 'sscc_level' })],
    });

    expect(errors).toEqual([]);
  });

  it('rejects filled counter row without name', () => {
    const errors = validateCodeGeneratorTemplateForm({
      name: 'T',
      template: '{a}',
      counter_config: [counter({ type: 'none', format: '08d' })],
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
      counter_config: [
        counter({ name: 'serial' }),
        counter({ name: 'serial', type: 'none' }),
      ],
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

  it('is true when type differs from default', () => {
    expect(isCounterRowFilledWithoutName(counter({ type: 'none' }))).toBe(true);
  });
});

describe('normalizeCounterConfig', () => {
  it('drops unnamed rows and trims named ones', () => {
    expect(
      normalizeCounterConfig([
        counter(),
        counter({ name: '  serial  ', key_template: ' k ', format: '' }),
      ]),
    ).toEqual([
      {
        name: 'serial',
        type: 'task_pack',
        key_template: 'k',
        format: '06d',
        level_from: 'aggregation_level',
        initial_value: 0,
      },
    ]);
  });
});

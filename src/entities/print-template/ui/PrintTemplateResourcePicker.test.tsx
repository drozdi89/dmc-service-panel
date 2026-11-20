import {
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
} from '../model/printTemplateFormUiStore';
import type { LookupOption } from '@/shared/ui/AsyncLookupSelect';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
}));

vi.mock('./SelectPrintTemplate', () => ({
  SelectPrintTemplate: ({
    value,
    selectedOption,
    onChange,
  }: {
    value?: string | number | null;
    selectedOption?: LookupOption | null;
    onChange?: (value: string | number | null, option?: LookupOption | null) => void;
  }) => (
    <div>
      <div
        data-testid="select-print-template"
        data-value={String(value ?? '')}
        data-label={selectedOption?.label ?? ''}
      />
      <button
        type="button"
        data-testid="select-pick"
        onClick={() => onChange?.(42, { value: 42, label: 'Picked locally' })}
      >
        pick
      </button>
    </div>
  ),
}));

import { PrintTemplateResourcePicker } from './PrintTemplateResourcePicker';

describe('PrintTemplateResourcePicker', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
  });

  it('opens create via store with stable consumerId', () => {
    render(<PrintTemplateResourcePicker consumerId="field-a" />);

    screen.getByRole('button', { name: 'Добавить' }).click();

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('opens edit via store for the current value', () => {
    render(
      <PrintTemplateResourcePicker consumerId="field-a" value={7} valueLabel="T7" />,
    );

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      templateId: 7,
      consumerId: 'field-a',
    });
  });

  it('consumes lastSaved for the same consumer and calls onChange', async () => {
    const onChange = vi.fn();
    render(
      <PrintTemplateResourcePicker
        consumerId="field-a"
        onChange={onChange}
      />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'field-a',
        id: 15,
        name: 'New template',
      });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(15, {
        value: 15,
        label: 'New template',
      });
    });
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('does not consume lastSaved for a different consumerId', async () => {
    const onChange = vi.fn();
    render(
      <PrintTemplateResourcePicker
        consumerId="field-a"
        onChange={onChange}
      />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'field-b',
        id: 15,
        name: 'Other',
      });
    });

    await waitFor(() => {
      expect(usePrintTemplateFormUiStore.getState().lastSaved).toEqual({
        consumerId: 'field-b',
        id: 15,
        name: 'Other',
      });
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('discards matching lastSaved and owned dialog on unmount', () => {
    const { unmount } = render(
      <PrintTemplateResourcePicker consumerId="field-a" />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().openCreate('field-a');
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'field-a',
        id: 22,
        name: 'Pending',
      });
    });

    unmount();

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('uses onCreate override instead of store', () => {
    const onCreate = vi.fn();
    render(
      <PrintTemplateResourcePicker consumerId="field-a" onCreate={onCreate} />,
    );

    screen.getByRole('button', { name: 'Добавить' }).click();

    expect(onCreate).toHaveBeenCalledOnce();
    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'none',
    });
  });

  it('follows parent selectedOption after local pick then external value change', async () => {
    function Harness() {
      const [value, setValue] = useState<number | null>(1);
      const [selectedOption, setSelectedOption] = useState<LookupOption | null>({
        value: 1,
        label: 'Initial',
      });

      return (
        <>
          <PrintTemplateResourcePicker
            consumerId="field-a"
            value={value ?? undefined}
            selectedOption={selectedOption}
            onChange={(nextValue, option) => {
              const id =
                nextValue === null || nextValue === undefined
                  ? null
                  : Number(nextValue);
              setValue(id);
              setSelectedOption(
                option
                  ? { value: option.value, label: option.label }
                  : id
                    ? { value: id, label: `#${id}` }
                    : null,
              );
            }}
          />
          <button
            type="button"
            data-testid="external-set"
            onClick={() => {
              setValue(99);
              setSelectedOption({ value: 99, label: 'From parent' });
            }}
          >
            external
          </button>
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId('select-print-template')).toHaveAttribute(
      'data-label',
      'Initial',
    );

    act(() => {
      screen.getByTestId('select-pick').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('select-print-template')).toHaveAttribute(
        'data-label',
        'Picked locally',
      );
    });

    act(() => {
      screen.getByTestId('external-set').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('select-print-template')).toHaveAttribute(
        'data-value',
        '99',
      );
      expect(screen.getByTestId('select-print-template')).toHaveAttribute(
        'data-label',
        'From parent',
      );
    });
  });
});

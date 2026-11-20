import {
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
} from '../model/printTemplateFormUiStore';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
  DeleteOutlined: () => null,
  ArrowUpOutlined: () => null,
  ArrowDownOutlined: () => null,
}));

vi.mock('@/shared/ui/AsyncLookupSelect', () => ({
  AsyncLookupSelect: () => <div data-testid="async-lookup-select" />,
}));

import { PrintTemplateResourceListEditor } from './PrintTemplateResourceListEditor';

describe('PrintTemplateResourceListEditor', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
  });

  it('renders ids with labels from the labels map', () => {
    render(
      <PrintTemplateResourceListEditor
        ids={[1, 2]}
        labels={{ 1: 'Alpha', 2: 'Beta' }}
        onChange={() => undefined}
        showCreate={false}
        showEdit={false}
      />,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('falls back to #id when label is missing', () => {
    render(
      <PrintTemplateResourceListEditor
        ids={[9]}
        labels={{}}
        onChange={() => undefined}
        showCreate={false}
        showEdit={false}
      />,
    );

    expect(screen.getByText('#9')).toBeInTheDocument();
  });

  it('reorders ids via enableReorder up/down', () => {
    const onChange = vi.fn();
    render(
      <PrintTemplateResourceListEditor
        ids={[1, 2, 3]}
        labels={{ 1: 'A', 2: 'B', 3: 'C' }}
        onChange={onChange}
        enableReorder
        showCreate={false}
        showEdit={false}
      />,
    );

    screen.getAllByRole('button', { name: 'Переместить вниз' })[0].click();
    expect(onChange).toHaveBeenCalledWith([2, 1, 3]);

    onChange.mockClear();
    screen.getAllByRole('button', { name: 'Переместить вверх' })[2].click();
    expect(onChange).toHaveBeenCalledWith([1, 3, 2]);
  });

  it('hides reorder controls when enableReorder is false', () => {
    render(
      <PrintTemplateResourceListEditor
        ids={[1, 2]}
        labels={{ 1: 'A', 2: 'B' }}
        onChange={() => undefined}
        showCreate={false}
        showEdit={false}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Переместить вверх' }),
    ).not.toBeInTheDocument();
  });

  it('removes an id on delete', () => {
    const onChange = vi.fn();
    render(
      <PrintTemplateResourceListEditor
        ids={[1, 2]}
        labels={{ 1: 'A', 2: 'B' }}
        onChange={onChange}
        showCreate={false}
        showEdit={false}
      />,
    );

    screen.getAllByRole('button', { name: 'Удалить' })[0].click();
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('opens create via store with consumerId', () => {
    render(
      <PrintTemplateResourceListEditor
        consumerId="list-a"
        ids={[]}
        labels={{}}
        onChange={() => undefined}
      />,
    );

    screen.getByRole('button', { name: 'Добавить' }).click();

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'list-a',
    });
  });

  it('opens edit via store for the row id', () => {
    render(
      <PrintTemplateResourceListEditor
        consumerId="list-a"
        ids={[7]}
        labels={{ 7: 'T7' }}
        onChange={() => undefined}
      />,
    );

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      templateId: 7,
      consumerId: 'list-a',
    });
  });

  it('consumes lastSaved: appends id and updates label', () => {
    const onChange = vi.fn();
    const onLabelChange = vi.fn();

    function Harness() {
      const [ids, setIds] = useState<number[]>([1]);
      return (
        <PrintTemplateResourceListEditor
          consumerId="list-a"
          ids={ids}
          labels={{ 1: 'Old' }}
          onChange={(next) => {
            onChange(next);
            setIds(next);
          }}
          onLabelChange={onLabelChange}
          showCreate={false}
          showEdit={false}
        />
      );
    }

    render(<Harness />);

    act(() => {
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'list-a',
        id: 42,
        name: 'Created',
      });
    });

    expect(onChange).toHaveBeenCalledWith([1, 42]);
    expect(onLabelChange).toHaveBeenCalledWith(42, 'Created');
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumes lastSaved for existing id: label only', () => {
    const onChange = vi.fn();
    const onLabelChange = vi.fn();

    render(
      <PrintTemplateResourceListEditor
        consumerId="list-a"
        ids={[7]}
        labels={{ 7: 'Old' }}
        onChange={onChange}
        onLabelChange={onLabelChange}
        showCreate={false}
        showEdit={false}
      />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'list-a',
        id: 7,
        name: 'Renamed',
      });
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(onLabelChange).toHaveBeenCalledWith(7, 'Renamed');
  });

  it('ignores lastSaved for a different consumerId', () => {
    const onChange = vi.fn();
    const onLabelChange = vi.fn();

    render(
      <PrintTemplateResourceListEditor
        consumerId="list-a"
        ids={[]}
        labels={{}}
        onChange={onChange}
        onLabelChange={onLabelChange}
        showCreate={false}
        showEdit={false}
      />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'other',
        id: 99,
        name: 'Other',
      });
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(onLabelChange).not.toHaveBeenCalled();
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'other',
      id: 99,
      name: 'Other',
    });
  });

  it('discards matching lastSaved and owned dialog on unmount', () => {
    const { unmount } = render(
      <PrintTemplateResourceListEditor
        consumerId="list-a"
        ids={[]}
        labels={{}}
        onChange={() => undefined}
        showCreate={false}
        showEdit={false}
      />,
    );

    act(() => {
      usePrintTemplateFormUiStore.getState().openCreate('list-a');
      usePrintTemplateFormUiStore.getState().setLastSaved({
        consumerId: 'list-a',
        id: 22,
        name: 'Pending',
      });
    });

    unmount();

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });
});

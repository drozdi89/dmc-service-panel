import type { LineEditorFormState } from '@/entities/line';
import {
  resetLineFormUiStore,
  useLineFormUiStore,
} from '@/entities/line';
import type { LineFormModalProps } from '@/features/line-editor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  saveLineConfiguration,
  createLineSaveMutator,
  invalidateLineQueries,
} = vi.hoisted(() => ({
  saveLineConfiguration: vi.fn(),
  createLineSaveMutator: vi.fn(() => vi.fn()),
  invalidateLineQueries: vi.fn(),
}));

vi.mock('@/entities/line', async () => {
  const store = await import('@/entities/line/model/lineFormUiStore');
  return {
    ...store,
    invalidateLineQueries,
    useLinePrintedDmRawQuery: () => ({
      data: '{}',
      isLoading: false,
      isSuccess: true,
    }),
  };
});

vi.mock('@/services/line-service', () => ({
  saveLineConfiguration,
  createLineSaveMutator,
}));

vi.mock('@/shared/api/headers', () => ({
  createIdempotencyKey: () => 'idem-key',
}));

vi.mock('@/features/line-editor', () => ({
  LineFormModal: ({ open, onSubmit, onCancel }: LineFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                name: 'Saved Line',
              } as LineEditorFormState,
              { close: true },
            )
          }
        >
          submit
        </button>
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </div>
    ) : null,
}));

import { LineFormModalHost } from './LineFormModalHost';

function renderHost(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <App>{ui as ReactNode}</App>
    </QueryClientProvider>,
  );
}

describe('LineFormModalHost', () => {
  beforeEach(() => {
    resetLineFormUiStore();
    saveLineConfiguration.mockReset();
    createLineSaveMutator.mockClear();
    invalidateLineQueries.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    saveLineConfiguration.mockResolvedValue({ lineId: 55 });
    useLineFormUiStore.getState().openCreate('field-a');

    renderHost(<LineFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = useLineFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        id: 55,
        name: 'Saved Line',
      });
    });
  });

  it('closes orphan create without lastSaved', async () => {
    saveLineConfiguration.mockResolvedValue({ lineId: 3 });
    useLineFormUiStore.getState().openCreate();

    renderHost(<LineFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(useLineFormUiStore.getState().dialog).toEqual({ kind: 'none' });
    });
    expect(useLineFormUiStore.getState().lastSaved).toBeNull();
    expect(invalidateLineQueries).toHaveBeenCalled();
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: { lineId: number }) => void;
    saveLineConfiguration.mockImplementation(
      () =>
        new Promise<{ lineId: number }>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useLineFormUiStore.getState().openCreate('field-a');
    renderHost(<LineFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveLineConfiguration).toHaveBeenCalled();
    });

    act(() => {
      useLineFormUiStore.getState().close();
      useLineFormUiStore.getState().openCreate('field-b');
    });

    await act(async () => {
      resolveSave({ lineId: 55 });
    });

    await waitFor(() => {
      const state = useLineFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
      expect(state.lastSaved).toBeNull();
    });
    expect(invalidateLineQueries).toHaveBeenCalled();
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: { lineId: number }) => void;
    saveLineConfiguration.mockImplementation(
      () =>
        new Promise<{ lineId: number }>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useLineFormUiStore.getState().openCreate('field-a');
    renderHost(<LineFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveLineConfiguration).toHaveBeenCalled();
    });

    act(() => {
      useLineFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave({ lineId: 55 });
    });

    await waitFor(() => {
      const state = useLineFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
    expect(invalidateLineQueries).toHaveBeenCalled();
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    useLineFormUiStore.getState().openCreate('field-a');
    useLineFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'Stale',
    });

    const { unmount } = renderHost(<LineFormModalHost />);
    unmount();

    expect(useLineFormUiStore.getState().dialog).toEqual({ kind: 'none' });
    expect(useLineFormUiStore.getState().lastSaved).toBeNull();
  });

  it('passes edit lineId into saveLineConfiguration', async () => {
    saveLineConfiguration.mockResolvedValue({ lineId: 9 });
    useLineFormUiStore.getState().openEdit(9);

    renderHost(<LineFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveLineConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Saved Line' }),
        9,
        '{}',
        expect.any(Function),
      );
    });
  });
});

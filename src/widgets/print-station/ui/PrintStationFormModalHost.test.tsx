import type { CreatePrintStationPayload, PrintStation } from '@/entities/print-station';
import {
  resetPrintStationFormUiStore,
  usePrintStationFormUiStore,
} from '@/entities/print-station';
import type { PrintStationFormModalProps } from '@/features/print-station-form';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/entities/print-station', async () => {
  const store = await import(
    '@/entities/print-station/model/printStationFormUiStore'
  );
  const mapping = await import(
    '@/entities/print-station/model/printStationFormMapping'
  );
  return {
    ...store,
    ...mapping,
    usePrintStationActions: () => ({
      createMutation: { mutateAsync, isPending: false },
      updateMutation: { mutateAsync, isPending: false },
      isSavePending: false,
    }),
  };
});

vi.mock('@/features/print-station-form', () => ({
  PrintStationFormModal: ({
    open,
    onSubmit,
    onCancel,
  }: PrintStationFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                name: 'Saved',
                printer: null,
                camera: null,
                template_id: null,
                max_failures: 5,
                grade_percent: 0,
              } satisfies CreatePrintStationPayload,
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

import { PrintStationFormModalHost } from './PrintStationFormModalHost';

const savedStation: PrintStation = {
  station_id: 99,
  name: 'Saved',
  printer: 0,
  camera: 0,
  template_id: null,
  max_failures: 5,
  grade_percent: 0,
};

describe('PrintStationFormModalHost', () => {
  beforeEach(() => {
    resetPrintStationFormUiStore();
    mutateAsync.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    mutateAsync.mockResolvedValue(savedStation);
    usePrintStationFormUiStore.getState().openCreate('field-a');

    render(<PrintStationFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = usePrintStationFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        id: 99,
        name: 'Saved',
      });
    });
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: PrintStation) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintStation>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintStationFormUiStore.getState().openCreate('field-a');
    render(<PrintStationFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      usePrintStationFormUiStore.getState().close();
      usePrintStationFormUiStore.getState().openCreate('field-b');
    });

    await act(async () => {
      resolveSave(savedStation);
    });

    await waitFor(() => {
      const state = usePrintStationFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: PrintStation) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintStation>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintStationFormUiStore.getState().openCreate('field-a');
    render(<PrintStationFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      usePrintStationFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave(savedStation);
    });

    await waitFor(() => {
      const state = usePrintStationFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    usePrintStationFormUiStore.getState().openCreate('field-a');
    usePrintStationFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'Stale',
    });

    const { unmount } = render(<PrintStationFormModalHost />);
    unmount();

    const state = usePrintStationFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('does not apply stale save after unmount when a matching dialog reopens', async () => {
    let resolveSave!: (value: PrintStation) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintStation>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintStationFormUiStore.getState().openCreate('field-a');
    const { unmount } = render(<PrintStationFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    unmount();

    act(() => {
      usePrintStationFormUiStore.getState().openCreate('field-a');
    });

    await act(async () => {
      resolveSave(savedStation);
    });

    await waitFor(() => {
      const state = usePrintStationFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-a' });
      expect(state.lastSaved).toBeNull();
    });
  });
});

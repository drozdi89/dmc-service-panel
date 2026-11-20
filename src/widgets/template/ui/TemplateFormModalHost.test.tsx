import type { PrintTemplate } from '@/entities/print-template';
import {
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
} from '@/entities/print-template';
import type { TemplateFormModalProps } from '@/features/template-form';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/entities/print-template', async () => {
  const store = await import(
    '@/entities/print-template/model/printTemplateFormUiStore'
  );
  return {
    ...store,
    usePrintTemplateActions: () => ({
      createMutation: { mutateAsync, isPending: false },
      updateMutation: { mutateAsync, isPending: false },
      isSavePending: false,
    }),
  };
});

vi.mock('@/features/template-form', () => ({
  TemplateFormModal: ({
    open,
    onSubmit,
    onCancel,
  }: TemplateFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                id: 0,
                name: 'Saved',
                template: 'body',
              } satisfies PrintTemplate,
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

import { TemplateFormModalHost } from './TemplateFormModalHost';

const savedTemplate: PrintTemplate = {
  id: 99,
  name: 'Saved',
  template: 'body',
};

describe('TemplateFormModalHost', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
    mutateAsync.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    mutateAsync.mockResolvedValue(savedTemplate);
    usePrintTemplateFormUiStore.getState().openCreate('field-a');

    render(<TemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = usePrintTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        id: 99,
        name: 'Saved',
      });
    });
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: PrintTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintTemplateFormUiStore.getState().openCreate('field-a');
    render(<TemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      usePrintTemplateFormUiStore.getState().close();
      usePrintTemplateFormUiStore.getState().openCreate('field-b');
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = usePrintTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: PrintTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintTemplateFormUiStore.getState().openCreate('field-a');
    render(<TemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      usePrintTemplateFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = usePrintTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    usePrintTemplateFormUiStore.getState().openCreate('field-a');
    usePrintTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'Stale',
    });

    const { unmount } = render(<TemplateFormModalHost />);
    unmount();

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('does not apply stale save after unmount when a matching dialog reopens', async () => {
    let resolveSave!: (value: PrintTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<PrintTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    usePrintTemplateFormUiStore.getState().openCreate('field-a');
    const { unmount } = render(<TemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    unmount();

    act(() => {
      usePrintTemplateFormUiStore.getState().openCreate('field-a');
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = usePrintTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-a' });
      expect(state.lastSaved).toBeNull();
    });
  });
});

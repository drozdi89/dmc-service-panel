import type { CodeGeneratorTemplate } from '@/entities/code-generator-template';
import {
  resetCodeGeneratorTemplateFormUiStore,
  useCodeGeneratorTemplateFormUiStore,
} from '@/entities/code-generator-template';
import type { CodeGeneratorTemplateFormModalProps } from '@/features/code-generator-template-form';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/entities/code-generator-template', async () => {
  const store = await import(
    '@/entities/code-generator-template/model/codeGeneratorTemplateFormUiStore'
  );
  return {
    ...store,
    CODE_GENERATOR_TEMPLATES_PATH: '/api/v2/code_generator_templates/',
    useCodeGeneratorTemplateActions: () => ({
      saveMutation: {
        mutateAsync,
        isPending: false,
      },
    }),
  };
});

vi.mock('@/features/code-generator-template-form', () => ({
  CodeGeneratorTemplateFormModal: ({
    open,
    onSubmit,
    onCancel,
  }: CodeGeneratorTemplateFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                id: 0,
                name: 'Saved',
                description: null,
                template: 'body',
                counter_config: [],
                validation_regex: null,
                is_system: false,
                legacy_type: null,
                counters: [],
              } satisfies CodeGeneratorTemplate,
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

import { CodeGeneratorTemplateFormModalHost } from './CodeGeneratorTemplateFormModalHost';

const savedTemplate: CodeGeneratorTemplate = {
  id: 99,
  name: 'Saved',
  template: 'body',
};

describe('CodeGeneratorTemplateFormModalHost', () => {
  beforeEach(() => {
    resetCodeGeneratorTemplateFormUiStore();
    mutateAsync.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    mutateAsync.mockResolvedValue(savedTemplate);
    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');

    render(<CodeGeneratorTemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = useCodeGeneratorTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        id: 99,
        name: 'Saved',
      });
    });
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: CodeGeneratorTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<CodeGeneratorTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');
    render(<CodeGeneratorTemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      useCodeGeneratorTemplateFormUiStore.getState().close();
      useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-b');
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = useCodeGeneratorTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: CodeGeneratorTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<CodeGeneratorTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');
    render(<CodeGeneratorTemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    act(() => {
      useCodeGeneratorTemplateFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = useCodeGeneratorTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');
    useCodeGeneratorTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'Stale',
    });

    const { unmount } = render(<CodeGeneratorTemplateFormModalHost />);
    unmount();

    const state = useCodeGeneratorTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('does not apply stale save after unmount when a matching dialog reopens', async () => {
    let resolveSave!: (value: CodeGeneratorTemplate) => void;
    mutateAsync.mockImplementation(
      () =>
        new Promise<CodeGeneratorTemplate>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');
    const { unmount } = render(<CodeGeneratorTemplateFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    unmount();

    act(() => {
      useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');
    });

    await act(async () => {
      resolveSave(savedTemplate);
    });

    await waitFor(() => {
      const state = useCodeGeneratorTemplateFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-a' });
      expect(state.lastSaved).toBeNull();
    });
  });
});

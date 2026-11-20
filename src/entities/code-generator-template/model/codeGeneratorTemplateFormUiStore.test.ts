import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardCodeGeneratorTemplateFormForConsumer,
  isSameCodeGeneratorTemplateFormDialog,
  resetCodeGeneratorTemplateFormUiStore,
  useCodeGeneratorTemplateFormUiStore,
} from './codeGeneratorTemplateFormUiStore';

describe('isSameCodeGeneratorTemplateFormDialog', () => {
  it('matches create dialogs by consumerId (including both undefined)', () => {
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create' },
        { kind: 'create' },
      ),
    ).toBe(true);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'b' },
      ),
    ).toBe(false);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create' },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by templateId and consumerId', () => {
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'edit', templateId: 1, consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'edit', templateId: 1 },
        { kind: 'edit', templateId: 2 },
      ),
    ).toBe(false);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'edit', templateId: 1, consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'a' },
      ),
    ).toBe(false);
    expect(
      isSameCodeGeneratorTemplateFormDialog(
        { kind: 'create' },
        { kind: 'none' },
      ),
    ).toBe(false);
  });
});

describe('useCodeGeneratorTemplateFormUiStore', () => {
  beforeEach(() => {
    resetCodeGeneratorTemplateFormUiStore();
  });

  it('openCreate without consumerId opens create dialog', () => {
    useCodeGeneratorTemplateFormUiStore.getState().openCreate();

    expect(useCodeGeneratorTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate with consumerId stores consumerId', () => {
    useCodeGeneratorTemplateFormUiStore.getState().openCreate('field-a');

    expect(useCodeGeneratorTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('openEdit stores templateId and optional consumerId', () => {
    useCodeGeneratorTemplateFormUiStore.getState().openEdit(42, 'field-b');

    expect(useCodeGeneratorTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      templateId: 42,
      consumerId: 'field-b',
    });
  });

  it('close resets dialog to none without clearing lastSaved', () => {
    const store = useCodeGeneratorTemplateFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 1, name: 'T' });
    store.close();

    const state = useCodeGeneratorTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-a',
      id: 1,
      name: 'T',
    });
  });

  it('consumeLastSaved returns payload once for matching consumerId', () => {
    useCodeGeneratorTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    const first =
      useCodeGeneratorTemplateFormUiStore.getState().consumeLastSaved('field-a');
    const second =
      useCodeGeneratorTemplateFormUiStore.getState().consumeLastSaved('field-a');

    expect(first).toEqual({ consumerId: 'field-a', id: 7, name: 'Label' });
    expect(second).toBeNull();
    expect(useCodeGeneratorTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumeLastSaved returns null for a different consumerId', () => {
    useCodeGeneratorTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    expect(
      useCodeGeneratorTemplateFormUiStore.getState().consumeLastSaved('field-b'),
    ).toBeNull();
    expect(useCodeGeneratorTemplateFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });
  });

  it('orphan create (no consumerId) does not require lastSaved for fields', () => {
    useCodeGeneratorTemplateFormUiStore.getState().openCreate();
    useCodeGeneratorTemplateFormUiStore.getState().close();

    expect(
      useCodeGeneratorTemplateFormUiStore
        .getState()
        .consumeLastSaved('any-field'),
    ).toBeNull();
    expect(useCodeGeneratorTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardCodeGeneratorTemplateFormForConsumer clears matching lastSaved and closes owned dialog', () => {
    const store = useCodeGeneratorTemplateFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 3, name: 'T' });

    discardCodeGeneratorTemplateFormForConsumer('field-a');

    const state = useCodeGeneratorTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('discardCodeGeneratorTemplateFormForConsumer leaves other consumers alone', () => {
    const store = useCodeGeneratorTemplateFormUiStore.getState();
    store.openCreate('field-b');
    store.setLastSaved({ consumerId: 'field-b', id: 3, name: 'T' });

    discardCodeGeneratorTemplateFormForConsumer('field-a');

    const state = useCodeGeneratorTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-b',
      id: 3,
      name: 'T',
    });
  });
});

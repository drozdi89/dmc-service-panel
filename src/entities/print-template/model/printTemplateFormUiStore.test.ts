import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardPrintTemplateFormForConsumer,
  isSamePrintTemplateFormDialog,
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
} from './printTemplateFormUiStore';

describe('isSamePrintTemplateFormDialog', () => {
  it('matches create dialogs by consumerId (including both undefined)', () => {
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSamePrintTemplateFormDialog({ kind: 'create' }, { kind: 'create' }),
    ).toBe(true);
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'b' },
      ),
    ).toBe(false);
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create' },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by templateId and consumerId', () => {
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'edit', templateId: 1, consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'edit', templateId: 1 },
        { kind: 'edit', templateId: 2 },
      ),
    ).toBe(false);
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'edit', templateId: 1, consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSamePrintTemplateFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'edit', templateId: 1, consumerId: 'a' },
      ),
    ).toBe(false);
    expect(
      isSamePrintTemplateFormDialog({ kind: 'create' }, { kind: 'none' }),
    ).toBe(false);
  });
});

describe('usePrintTemplateFormUiStore', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
  });

  it('openCreate without consumerId opens create dialog', () => {
    usePrintTemplateFormUiStore.getState().openCreate();

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate with consumerId stores consumerId', () => {
    usePrintTemplateFormUiStore.getState().openCreate('field-a');

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('openEdit stores templateId and optional consumerId', () => {
    usePrintTemplateFormUiStore.getState().openEdit(42, 'field-b');

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      templateId: 42,
      consumerId: 'field-b',
    });
  });

  it('close resets dialog to none without clearing lastSaved', () => {
    const store = usePrintTemplateFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 1, name: 'T' });
    store.close();

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-a',
      id: 1,
      name: 'T',
    });
  });

  it('consumeLastSaved returns payload once for matching consumerId', () => {
    usePrintTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    const first =
      usePrintTemplateFormUiStore.getState().consumeLastSaved('field-a');
    const second =
      usePrintTemplateFormUiStore.getState().consumeLastSaved('field-a');

    expect(first).toEqual({ consumerId: 'field-a', id: 7, name: 'Label' });
    expect(second).toBeNull();
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumeLastSaved returns null for a different consumerId', () => {
    usePrintTemplateFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    expect(
      usePrintTemplateFormUiStore.getState().consumeLastSaved('field-b'),
    ).toBeNull();
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });
  });

  it('orphan create (no consumerId) does not require lastSaved for fields', () => {
    usePrintTemplateFormUiStore.getState().openCreate();
    usePrintTemplateFormUiStore.getState().close();

    expect(
      usePrintTemplateFormUiStore.getState().consumeLastSaved('any-field'),
    ).toBeNull();
    expect(usePrintTemplateFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardPrintTemplateFormForConsumer clears matching lastSaved and closes owned dialog', () => {
    const store = usePrintTemplateFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 3, name: 'T' });

    discardPrintTemplateFormForConsumer('field-a');

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('discardPrintTemplateFormForConsumer leaves other consumers alone', () => {
    const store = usePrintTemplateFormUiStore.getState();
    store.openCreate('field-b');
    store.setLastSaved({ consumerId: 'field-b', id: 3, name: 'T' });

    discardPrintTemplateFormForConsumer('field-a');

    const state = usePrintTemplateFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-b',
      id: 3,
      name: 'T',
    });
  });
});

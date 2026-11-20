import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardProductFormForConsumer,
  isSameProductFormDialog,
  resetProductFormUiStore,
  useProductFormUiStore,
} from './productFormUiStore';

describe('isSameProductFormDialog', () => {
  it('matches create dialogs by consumerId (including both undefined)', () => {
    expect(
      isSameProductFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSameProductFormDialog({ kind: 'create' }, { kind: 'create' }),
    ).toBe(true);
    expect(
      isSameProductFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'b' },
      ),
    ).toBe(false);
    expect(
      isSameProductFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create' },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by gtin and consumerId', () => {
    expect(
      isSameProductFormDialog(
        { kind: 'edit', gtin: '4601234567890', consumerId: 'a' },
        { kind: 'edit', gtin: '4601234567890', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSameProductFormDialog(
        { kind: 'edit', gtin: '4601234567890' },
        { kind: 'edit', gtin: '4609999999999' },
      ),
    ).toBe(false);
    expect(
      isSameProductFormDialog(
        { kind: 'edit', gtin: '4601234567890', consumerId: 'a' },
        { kind: 'edit', gtin: '4601234567890', consumerId: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSameProductFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'edit', gtin: '4601234567890', consumerId: 'a' },
      ),
    ).toBe(false);
    expect(
      isSameProductFormDialog({ kind: 'create' }, { kind: 'none' }),
    ).toBe(false);
  });
});

describe('useProductFormUiStore', () => {
  beforeEach(() => {
    resetProductFormUiStore();
  });

  it('openCreate without consumerId opens create dialog', () => {
    useProductFormUiStore.getState().openCreate();

    expect(useProductFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate with consumerId stores consumerId', () => {
    useProductFormUiStore.getState().openCreate('field-a');

    expect(useProductFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('openEdit stores gtin and optional consumerId', () => {
    useProductFormUiStore.getState().openEdit('4601234567890', 'field-b');

    expect(useProductFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      gtin: '4601234567890',
      consumerId: 'field-b',
    });
  });

  it('close resets dialog to none without clearing lastSaved', () => {
    const store = useProductFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });
    store.close();

    const state = useProductFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });
  });

  it('consumeLastSaved returns payload once for matching consumerId', () => {
    useProductFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });

    const first = useProductFormUiStore.getState().consumeLastSaved('field-a');
    const second = useProductFormUiStore.getState().consumeLastSaved('field-a');

    expect(first).toEqual({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });
    expect(second).toBeNull();
    expect(useProductFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumeLastSaved returns null for a different consumerId', () => {
    useProductFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });

    expect(
      useProductFormUiStore.getState().consumeLastSaved('field-b'),
    ).toBeNull();
    expect(useProductFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });
  });

  it('orphan create (no consumerId) does not require lastSaved for fields', () => {
    useProductFormUiStore.getState().openCreate();
    useProductFormUiStore.getState().close();

    expect(
      useProductFormUiStore.getState().consumeLastSaved('any-field'),
    ).toBeNull();
    expect(useProductFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardProductFormForConsumer clears matching lastSaved and closes owned dialog', () => {
    const store = useProductFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({
      consumerId: 'field-a',
      gtin: '4601234567890',
      name: 'Milk',
    });

    discardProductFormForConsumer('field-a');

    const state = useProductFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('discardProductFormForConsumer leaves other consumers alone', () => {
    const store = useProductFormUiStore.getState();
    store.openCreate('field-b');
    store.setLastSaved({
      consumerId: 'field-b',
      gtin: '4601234567890',
      name: 'Milk',
    });

    discardProductFormForConsumer('field-a');

    const state = useProductFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-b',
      gtin: '4601234567890',
      name: 'Milk',
    });
  });
});

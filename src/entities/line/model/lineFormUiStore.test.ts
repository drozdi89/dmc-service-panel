import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardLineFormForConsumer,
  isSameLineFormDialog,
  resetLineFormUiStore,
  useLineFormUiStore,
} from './lineFormUiStore';

describe('isSameLineFormDialog', () => {
  it('matches create dialogs by consumerId (including both undefined)', () => {
    expect(
      isSameLineFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(isSameLineFormDialog({ kind: 'create' }, { kind: 'create' })).toBe(
      true,
    );
    expect(
      isSameLineFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'b' },
      ),
    ).toBe(false);
    expect(
      isSameLineFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create' },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by lineId and consumerId', () => {
    expect(
      isSameLineFormDialog(
        { kind: 'edit', lineId: 1, consumerId: 'a' },
        { kind: 'edit', lineId: 1, consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSameLineFormDialog(
        { kind: 'edit', lineId: 1 },
        { kind: 'edit', lineId: 2 },
      ),
    ).toBe(false);
    expect(
      isSameLineFormDialog(
        { kind: 'edit', lineId: 1, consumerId: 'a' },
        { kind: 'edit', lineId: 1, consumerId: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSameLineFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'edit', lineId: 1, consumerId: 'a' },
      ),
    ).toBe(false);
    expect(
      isSameLineFormDialog({ kind: 'create' }, { kind: 'none' }),
    ).toBe(false);
  });
});

describe('useLineFormUiStore', () => {
  beforeEach(() => {
    resetLineFormUiStore();
  });

  it('openCreate without consumerId opens create dialog', () => {
    useLineFormUiStore.getState().openCreate();

    expect(useLineFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate with consumerId stores it', () => {
    useLineFormUiStore.getState().openCreate('field-a');

    expect(useLineFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('openEdit stores lineId and optional consumerId', () => {
    useLineFormUiStore.getState().openEdit(42);
    expect(useLineFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      lineId: 42,
    });

    useLineFormUiStore.getState().openEdit(7, 'picker');
    expect(useLineFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      lineId: 7,
      consumerId: 'picker',
    });
  });

  it('close clears dialog', () => {
    useLineFormUiStore.getState().openCreate();
    useLineFormUiStore.getState().close();
    expect(useLineFormUiStore.getState().dialog).toEqual({ kind: 'none' });
  });

  it('consumeLastSaved returns and clears matching payload', () => {
    useLineFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 10,
      name: 'Line A',
    });

    expect(useLineFormUiStore.getState().consumeLastSaved('field-b')).toBeNull();
    expect(useLineFormUiStore.getState().lastSaved).not.toBeNull();

    expect(useLineFormUiStore.getState().consumeLastSaved('field-a')).toEqual({
      consumerId: 'field-a',
      id: 10,
      name: 'Line A',
    });
    expect(useLineFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardLineFormForConsumer clears owned dialog and lastSaved', () => {
    useLineFormUiStore.getState().openCreate('field-a');
    useLineFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'X',
    });

    discardLineFormForConsumer('field-a');

    expect(useLineFormUiStore.getState().dialog).toEqual({ kind: 'none' });
    expect(useLineFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardLineFormForConsumer ignores other consumers', () => {
    useLineFormUiStore.getState().openCreate('field-a');
    useLineFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'X',
    });

    discardLineFormForConsumer('field-b');

    expect(useLineFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
    expect(useLineFormUiStore.getState().lastSaved).not.toBeNull();
  });
});

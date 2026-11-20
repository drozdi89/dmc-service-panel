import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardPrintStationFormForConsumer,
  isSamePrintStationFormDialog,
  resetPrintStationFormUiStore,
  usePrintStationFormUiStore,
} from './printStationFormUiStore';

describe('isSamePrintStationFormDialog', () => {
  it('matches create dialogs by consumerId (including both undefined)', () => {
    expect(
      isSamePrintStationFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSamePrintStationFormDialog({ kind: 'create' }, { kind: 'create' }),
    ).toBe(true);
    expect(
      isSamePrintStationFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create', consumerId: 'b' },
      ),
    ).toBe(false);
    expect(
      isSamePrintStationFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'create' },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by stationId and consumerId', () => {
    expect(
      isSamePrintStationFormDialog(
        { kind: 'edit', stationId: 1, consumerId: 'a' },
        { kind: 'edit', stationId: 1, consumerId: 'a' },
      ),
    ).toBe(true);
    expect(
      isSamePrintStationFormDialog(
        { kind: 'edit', stationId: 1 },
        { kind: 'edit', stationId: 2 },
      ),
    ).toBe(false);
    expect(
      isSamePrintStationFormDialog(
        { kind: 'edit', stationId: 1, consumerId: 'a' },
        { kind: 'edit', stationId: 1, consumerId: 'b' },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSamePrintStationFormDialog(
        { kind: 'create', consumerId: 'a' },
        { kind: 'edit', stationId: 1, consumerId: 'a' },
      ),
    ).toBe(false);
    expect(
      isSamePrintStationFormDialog({ kind: 'create' }, { kind: 'none' }),
    ).toBe(false);
  });
});

describe('usePrintStationFormUiStore', () => {
  beforeEach(() => {
    resetPrintStationFormUiStore();
  });

  it('openCreate without consumerId opens create dialog', () => {
    usePrintStationFormUiStore.getState().openCreate();

    expect(usePrintStationFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate with consumerId stores consumerId', () => {
    usePrintStationFormUiStore.getState().openCreate('field-a');

    expect(usePrintStationFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('openEdit stores stationId and optional consumerId', () => {
    usePrintStationFormUiStore.getState().openEdit(42, 'field-b');

    expect(usePrintStationFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      stationId: 42,
      consumerId: 'field-b',
    });
  });

  it('close resets dialog to none without clearing lastSaved', () => {
    const store = usePrintStationFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 1, name: 'S' });
    store.close();

    const state = usePrintStationFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-a',
      id: 1,
      name: 'S',
    });
  });

  it('consumeLastSaved returns payload once for matching consumerId', () => {
    usePrintStationFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Station',
    });

    const first =
      usePrintStationFormUiStore.getState().consumeLastSaved('field-a');
    const second =
      usePrintStationFormUiStore.getState().consumeLastSaved('field-a');

    expect(first).toEqual({ consumerId: 'field-a', id: 7, name: 'Station' });
    expect(second).toBeNull();
    expect(usePrintStationFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumeLastSaved returns null for a different consumerId', () => {
    usePrintStationFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Station',
    });

    expect(
      usePrintStationFormUiStore.getState().consumeLastSaved('field-b'),
    ).toBeNull();
    expect(usePrintStationFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'field-a',
      id: 7,
      name: 'Station',
    });
  });

  it('orphan create (no consumerId) does not require lastSaved for fields', () => {
    usePrintStationFormUiStore.getState().openCreate();
    usePrintStationFormUiStore.getState().close();

    expect(
      usePrintStationFormUiStore.getState().consumeLastSaved('any-field'),
    ).toBeNull();
    expect(usePrintStationFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardPrintStationFormForConsumer clears matching lastSaved and closes owned dialog', () => {
    const store = usePrintStationFormUiStore.getState();
    store.openCreate('field-a');
    store.setLastSaved({ consumerId: 'field-a', id: 3, name: 'S' });

    discardPrintStationFormForConsumer('field-a');

    const state = usePrintStationFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('discardPrintStationFormForConsumer leaves other consumers alone', () => {
    const store = usePrintStationFormUiStore.getState();
    store.openCreate('field-b');
    store.setLastSaved({ consumerId: 'field-b', id: 3, name: 'S' });

    discardPrintStationFormForConsumer('field-a');

    const state = usePrintStationFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-b',
      id: 3,
      name: 'S',
    });
  });
});

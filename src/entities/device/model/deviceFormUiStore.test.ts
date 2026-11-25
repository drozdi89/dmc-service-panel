import { beforeEach, describe, expect, it } from 'vitest';
import {
  discardDeviceFormForConsumer,
  isSameDeviceFormDialog,
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from './deviceFormUiStore';

describe('isSameDeviceFormDialog', () => {
  it('matches create dialogs by consumerId, type-lock and defaultScaleType', () => {
    expect(
      isSameDeviceFormDialog(
        {
          kind: 'create',
          consumerId: 'a',
          deviceType: 'camera',
          lockDeviceType: true,
        },
        {
          kind: 'create',
          consumerId: 'a',
          deviceType: 'camera',
          lockDeviceType: true,
        },
      ),
    ).toBe(true);
    expect(
      isSameDeviceFormDialog({ kind: 'create' }, { kind: 'create' }),
    ).toBe(true);
    expect(
      isSameDeviceFormDialog(
        { kind: 'create', consumerId: 'a', deviceType: 'camera' },
        { kind: 'create', consumerId: 'a', deviceType: 'printer' },
      ),
    ).toBe(false);
    expect(
      isSameDeviceFormDialog(
        {
          kind: 'create',
          consumerId: 'a',
          deviceType: 'scale',
          defaultScaleType: 1,
        },
        {
          kind: 'create',
          consumerId: 'a',
          deviceType: 'scale',
          defaultScaleType: 2,
        },
      ),
    ).toBe(false);
  });

  it('matches edit dialogs by deviceId, deviceType and consumerId', () => {
    expect(
      isSameDeviceFormDialog(
        {
          kind: 'edit',
          deviceId: 1,
          deviceType: 'camera',
          consumerId: 'a',
        },
        {
          kind: 'edit',
          deviceId: 1,
          deviceType: 'camera',
          consumerId: 'a',
        },
      ),
    ).toBe(true);
    expect(
      isSameDeviceFormDialog(
        { kind: 'edit', deviceId: 1, deviceType: 'camera' },
        { kind: 'edit', deviceId: 2, deviceType: 'camera' },
      ),
    ).toBe(false);
    expect(
      isSameDeviceFormDialog(
        {
          kind: 'edit',
          deviceId: 1,
          deviceType: 'camera',
          consumerId: 'a',
        },
        {
          kind: 'edit',
          deviceId: 1,
          deviceType: 'printer',
          consumerId: 'a',
        },
      ),
    ).toBe(false);
  });

  it('returns false across different kinds', () => {
    expect(
      isSameDeviceFormDialog(
        { kind: 'create', consumerId: 'a', deviceType: 'camera' },
        {
          kind: 'edit',
          deviceId: 1,
          deviceType: 'camera',
          consumerId: 'a',
        },
      ),
    ).toBe(false);
    expect(
      isSameDeviceFormDialog({ kind: 'create' }, { kind: 'none' }),
    ).toBe(false);
  });
});

describe('useDeviceFormUiStore', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('openCreate without options opens create dialog', () => {
    useDeviceFormUiStore.getState().openCreate();

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
    });
  });

  it('openCreate stores type-lock and defaultScaleType for line create', () => {
    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
  });

  it('openEdit stores deviceId, deviceType and optional consumerId', () => {
    useDeviceFormUiStore.getState().openEdit(42, {
      deviceType: 'printer',
      consumerId: 'field-b',
      lockDeviceType: true,
    });

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      deviceId: 42,
      deviceType: 'printer',
      consumerId: 'field-b',
      lockDeviceType: true,
    });
  });

  it('close resets dialog to none without clearing lastSaved', () => {
    const store = useDeviceFormUiStore.getState();
    store.openCreate({ consumerId: 'field-a', deviceType: 'camera' });
    store.setLastSaved({ consumerId: 'field-a', id: 1, name: 'Cam' });
    store.close();

    const state = useDeviceFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-a',
      id: 1,
      name: 'Cam',
    });
  });

  it('consumeLastSaved returns payload once for matching consumerId', () => {
    useDeviceFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    const first = useDeviceFormUiStore.getState().consumeLastSaved('field-a');
    const second = useDeviceFormUiStore.getState().consumeLastSaved('field-a');

    expect(first).toEqual({ consumerId: 'field-a', id: 7, name: 'Label' });
    expect(second).toBeNull();
    expect(useDeviceFormUiStore.getState().lastSaved).toBeNull();
  });

  it('consumeLastSaved returns null for a different consumerId', () => {
    useDeviceFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });

    expect(
      useDeviceFormUiStore.getState().consumeLastSaved('field-b'),
    ).toBeNull();
    expect(useDeviceFormUiStore.getState().lastSaved).toEqual({
      consumerId: 'field-a',
      id: 7,
      name: 'Label',
    });
  });

  it('orphan create (no consumerId) does not require lastSaved for fields', () => {
    useDeviceFormUiStore.getState().openCreate();
    useDeviceFormUiStore.getState().close();

    expect(
      useDeviceFormUiStore.getState().consumeLastSaved('any-field'),
    ).toBeNull();
    expect(useDeviceFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discardDeviceFormForConsumer clears matching lastSaved and closes owned dialog', () => {
    const store = useDeviceFormUiStore.getState();
    store.openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
    store.setLastSaved({ consumerId: 'field-a', id: 3, name: 'Cam' });

    discardDeviceFormForConsumer('field-a');

    const state = useDeviceFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('discardDeviceFormForConsumer leaves other consumers alone', () => {
    const store = useDeviceFormUiStore.getState();
    store.openCreate({
      consumerId: 'field-b',
      deviceType: 'printer',
      lockDeviceType: true,
    });
    store.setLastSaved({ consumerId: 'field-b', id: 3, name: 'Prn' });

    discardDeviceFormForConsumer('field-a');

    const state = useDeviceFormUiStore.getState();
    expect(state.dialog).toEqual({
      kind: 'create',
      consumerId: 'field-b',
      deviceType: 'printer',
      lockDeviceType: true,
    });
    expect(state.lastSaved).toEqual({
      consumerId: 'field-b',
      id: 3,
      name: 'Prn',
    });
  });
});

describe('setCreateDeviceType', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('changes device type of an unlocked create dialog', () => {
    useDeviceFormUiStore.getState().openCreate({ consumerId: 'a' });
    useDeviceFormUiStore.getState().setCreateDeviceType('printer');
    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'a',
      deviceType: 'printer',
    });
  });

  it('ignores type-locked create and edit dialogs', () => {
    useDeviceFormUiStore
      .getState()
      .openCreate({ deviceType: 'scale', lockDeviceType: true });
    useDeviceFormUiStore.getState().setCreateDeviceType('printer');
    expect(useDeviceFormUiStore.getState().dialog).toMatchObject({
      deviceType: 'scale',
    });

    useDeviceFormUiStore.getState().openEdit(1, { deviceType: 'camera' });
    useDeviceFormUiStore.getState().setCreateDeviceType('printer');
    expect(useDeviceFormUiStore.getState().dialog).toMatchObject({
      kind: 'edit',
      deviceType: 'camera',
    });
  });
});

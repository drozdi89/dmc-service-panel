import type { DeviceFormValues, DeviceRef } from '@/entities/device';
import {
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from '@/entities/device';
import type { DeviceFormModalProps } from '@/features/device-form';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveDevice } = vi.hoisted(() => ({ saveDevice: vi.fn() }));

vi.mock('@/entities/device', async () => {
  const store = await import('@/entities/device/model/deviceFormUiStore');
  const constants = await import('@/entities/device/model/constants');
  return {
    ...store,
    ...constants,
    useDeviceActions: () => ({
      saveDevice,
      isPending: false,
    }),
  };
});

vi.mock('@/features/device-form', () => ({
  DeviceFormModal: ({ open, onSubmit, onCancel }: DeviceFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              { name: 'Saved' } as DeviceFormValues,
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

import { DeviceFormModalHost } from './DeviceFormModalHost';

const savedRef: DeviceRef = {
  device_type: 'camera',
  id: 99,
  name: 'Saved',
};

describe('DeviceFormModalHost', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
    saveDevice.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    saveDevice.mockResolvedValue(savedRef);
    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });

    render(<DeviceFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveDevice).toHaveBeenCalledWith({
        deviceType: 'camera',
        values: { name: 'Saved' },
        editId: undefined,
      });
      const state = useDeviceFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        id: 99,
        name: 'Saved',
      });
    });
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: DeviceRef) => void;
    saveDevice.mockImplementation(
      () =>
        new Promise<DeviceRef>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
    render(<DeviceFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveDevice).toHaveBeenCalled();
    });

    act(() => {
      useDeviceFormUiStore.getState().close();
      useDeviceFormUiStore.getState().openCreate({
        consumerId: 'field-b',
        deviceType: 'printer',
        lockDeviceType: true,
      });
    });

    await act(async () => {
      resolveSave(savedRef);
    });

    await waitFor(() => {
      const state = useDeviceFormUiStore.getState();
      expect(state.dialog).toEqual({
        kind: 'create',
        consumerId: 'field-b',
        deviceType: 'printer',
        lockDeviceType: true,
      });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: DeviceRef) => void;
    saveDevice.mockImplementation(
      () =>
        new Promise<DeviceRef>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
    render(<DeviceFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveDevice).toHaveBeenCalled();
    });

    act(() => {
      useDeviceFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave(savedRef);
    });

    await waitFor(() => {
      const state = useDeviceFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
    useDeviceFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      id: 1,
      name: 'Stale',
    });

    const { unmount } = render(<DeviceFormModalHost />);
    unmount();

    const state = useDeviceFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('does not apply stale save after unmount when a matching dialog reopens', async () => {
    let resolveSave!: (value: DeviceRef) => void;
    saveDevice.mockImplementation(
      () =>
        new Promise<DeviceRef>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useDeviceFormUiStore.getState().openCreate({
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
    const { unmount } = render(<DeviceFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveDevice).toHaveBeenCalled();
    });

    unmount();

    act(() => {
      useDeviceFormUiStore.getState().openCreate({
        consumerId: 'field-a',
        deviceType: 'camera',
        lockDeviceType: true,
      });
    });

    await act(async () => {
      resolveSave(savedRef);
    });

    await waitFor(() => {
      const state = useDeviceFormUiStore.getState();
      expect(state.dialog).toEqual({
        kind: 'create',
        consumerId: 'field-a',
        deviceType: 'camera',
        lockDeviceType: true,
      });
      expect(state.lastSaved).toBeNull();
    });
  });
});

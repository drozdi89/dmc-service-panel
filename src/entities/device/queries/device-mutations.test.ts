import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DeviceDetail, DeviceFormValues } from '../model/deviceFormMapping';
import { invalidateDeviceQueries, persistDeviceFormValues } from './device-mutations';

describe('invalidateDeviceQueries', () => {
  it('invalidates list/lookup entry and device-detail prefix', async () => {
    const invalidateQueries = vi.fn(async () => undefined);
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    await invalidateDeviceQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['devices'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['device-detail'],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe('persistDeviceFormValues', () => {
  const baseValues: DeviceFormValues = {
    device_type: 'camera',
    name: 'Cam-1',
    host: '10.0.0.1',
    port: 10001,
  };

  it('POSTs on create and returns DeviceRef', async () => {
    const save = vi.fn(async () => {
      return { id: 42, name: 'Cam-1', host: '10.0.0.1', port: 10001 } as DeviceDetail;
    });

    const ref = await persistDeviceFormValues(save, baseValues);

    expect(save).toHaveBeenCalledWith({ values: baseValues, editId: undefined });
    expect(ref).toEqual({ device_type: 'camera', id: 42, name: 'Cam-1' });
  });

  it('PATCHes when editId is provided', async () => {
    const save = vi.fn(async () => {
      return { id: 7, name: 'Cam-7', host: '10.0.0.2', port: 10001 } as DeviceDetail;
    });

    const ref = await persistDeviceFormValues(
      save,
      { ...baseValues, name: 'Cam-7' },
      7,
    );

    expect(save).toHaveBeenCalledWith({
      values: { ...baseValues, name: 'Cam-7' },
      editId: 7,
    });
    expect(ref).toEqual({ device_type: 'camera', id: 7, name: 'Cam-7' });
  });
});
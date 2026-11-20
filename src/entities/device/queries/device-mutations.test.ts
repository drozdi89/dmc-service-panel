import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { IdempotentMutationVariables } from '@/shared/hooks/useIdempotentMutation';
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

  it('POSTs to collection path on create and returns DeviceRef', async () => {
    const mutateAsync = vi.fn(async (_vars: IdempotentMutationVariables) => {
      return { id: 42, name: 'Cam-1', host: '10.0.0.1', port: 10001 } as DeviceDetail;
    });

    const ref = await persistDeviceFormValues(mutateAsync, baseValues);

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/cameras/',
        method: 'POST',
      }),
    );
    expect(ref).toEqual({ device_type: 'camera', id: 42, name: 'Cam-1' });
  });

  it('PATCHes item path when editId is provided', async () => {
    const mutateAsync = vi.fn(async (_vars: IdempotentMutationVariables) => {
      return { id: 7, name: 'Cam-7', host: '10.0.0.2', port: 10001 } as DeviceDetail;
    });

    const ref = await persistDeviceFormValues(
      mutateAsync,
      { ...baseValues, name: 'Cam-7' },
      7,
    );

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/cameras/7',
        method: 'PATCH',
      }),
    );
    expect(ref).toEqual({ device_type: 'camera', id: 7, name: 'Cam-7' });
  });

  it('uses payload.id as edit id when editId is omitted', async () => {
    const mutateAsync = vi.fn(async (_vars: IdempotentMutationVariables) => {
      return { id: 9, name: 'Cam-9', host: '10.0.0.3', port: 10001 } as DeviceDetail;
    });

    await persistDeviceFormValues(mutateAsync, { ...baseValues, id: 9 });

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/cameras/9',
        method: 'PATCH',
      }),
    );
  });
});

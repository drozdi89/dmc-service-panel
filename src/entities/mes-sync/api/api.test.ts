import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as sharedApi from '@/shared/api';
import {
  createMesSyncBinding,
  fetchMesSyncBindings,
  fetchMesSyncServerSettings,
  rotateMesSyncBinding,
  updateMesSyncServerSettings,
} from './api';

vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...actual,
    apiRequestData: vi.fn(),
    createIdempotencyKey: () => 'idem-key',
  };
});

describe('mes-sync api', () => {
  beforeEach(() => {
    vi.mocked(sharedApi.apiRequestData).mockReset();
  });

  it('GETs server settings from mes_sync/server', async () => {
    vi.mocked(sharedApi.apiRequestData).mockResolvedValue({ server_node_id: 'abc' });
    await fetchMesSyncServerSettings();
    expect(sharedApi.apiRequestData).toHaveBeenCalledWith(
      '/api/v2/service_config/mes_sync/server',
      expect.objectContaining({ signal: undefined }),
    );
  });

  it('PUTs server_node_id with idempotency key', async () => {
    vi.mocked(sharedApi.apiRequestData).mockResolvedValue({
      server_node_id: '11111111-1111-1111-1111-111111111111',
    });
    await updateMesSyncServerSettings({
      server_node_id: '11111111-1111-1111-1111-111111111111',
    });
    expect(sharedApi.apiRequestData).toHaveBeenCalledWith(
      '/api/v2/service_config/mes_sync/server',
      {
        method: 'PUT',
        body: { server_node_id: '11111111-1111-1111-1111-111111111111' },
        idempotencyKey: 'idem-key',
      },
    );
  });

  it('lists bindings with include_revoked', async () => {
    vi.mocked(sharedApi.apiRequestData).mockResolvedValue([]);
    await fetchMesSyncBindings(true);
    expect(sharedApi.apiRequestData).toHaveBeenCalledWith(
      '/api/v2/service_config/mes_sync/bindings',
      expect.objectContaining({
        params: { include_revoked: true },
      }),
    );
  });

  it('POSTs create binding body', async () => {
    vi.mocked(sharedApi.apiRequestData).mockResolvedValue({
      id: 'b1',
      token: 'secret',
      label: 'A',
      node_id: 'n1',
      line_ids: [1],
      fingerprint: 'ff',
      created_at: '2026-01-01T00:00:00Z',
      is_active: true,
    });
    await createMesSyncBinding({
      label: 'A',
      node_id: '22222222-2222-2222-2222-222222222222',
      line_ids: [1, 2],
    });
    expect(sharedApi.apiRequestData).toHaveBeenCalledWith(
      '/api/v2/service_config/mes_sync/bindings',
      {
        method: 'POST',
        body: {
          label: 'A',
          node_id: '22222222-2222-2222-2222-222222222222',
          line_ids: [1, 2],
        },
        idempotencyKey: 'idem-key',
      },
    );
  });

  it('POSTs rotate on binding id', async () => {
    vi.mocked(sharedApi.apiRequestData).mockResolvedValue({
      id: 'b1',
      token: 'new',
      label: 'A',
      node_id: 'n1',
      line_ids: [1],
      fingerprint: 'ff',
      created_at: '2026-01-01T00:00:00Z',
      is_active: true,
    });
    await rotateMesSyncBinding('b1');
    expect(sharedApi.apiRequestData).toHaveBeenCalledWith(
      '/api/v2/service_config/mes_sync/bindings/b1/rotate',
      {
        method: 'POST',
        idempotencyKey: 'idem-key',
      },
    );
  });
});

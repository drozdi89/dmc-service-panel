import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildApiHeaders,
  createIdempotencyKey,
  DMC_CLIENT_ID_HEADER,
  DMC_CLIENT_TYPE,
  DMC_CLIENT_TYPE_HEADER,
  DMC_INSTALLATION_ID_STORAGE_KEY,
  getOrCreateInstallationClientId,
  IDEMPOTENCY_KEY_HEADER,
  requiresIdempotencyKey,
  resetInstallationClientIdCacheForTests,
} from './headers';

const requestMock = vi.hoisted(() => vi.fn());

vi.mock('./http', () => ({
  getHttpClient: () => ({
    request: requestMock,
  }),
}));

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reads a request header without relying on the transport's header-name casing.
 *
 * @param headers - Outgoing request headers.
 * @param name - Header name to read.
 * @returns Header value when present.
 */
function getHeaderValue(headers: Record<string, string>, name: string): string | undefined {
  const normalizedName = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === normalizedName);
  return entry?.[1];
}

describe('headers', () => {
  beforeEach(() => {
    localStorage.clear();
    resetInstallationClientIdCacheForTests();
  });

  afterEach(() => {
    localStorage.clear();
    resetInstallationClientIdCacheForTests();
  });

  it('creates a valid UUID idempotency key', () => {
    const key = createIdempotencyKey();
    expect(key).toMatch(UUID_PATTERN);
  });

  it('requires idempotency key for mutation methods only', () => {
    expect(requiresIdempotencyKey('GET')).toBe(false);
    expect(requiresIdempotencyKey('post')).toBe(true);
    expect(requiresIdempotencyKey('PATCH')).toBe(true);
    expect(requiresIdempotencyKey('DELETE')).toBe(true);
  });

  it('exports WEB client identity constants', () => {
    expect(DMC_CLIENT_TYPE).toBe('WEB');
    expect(DMC_CLIENT_TYPE_HEADER).toBe('dmc-client-type');
    expect(DMC_CLIENT_ID_HEADER).toBe('dmc-client-id');
    expect(DMC_INSTALLATION_ID_STORAGE_KEY).toBe('dmc-installation-id');
    expect(IDEMPOTENCY_KEY_HEADER).toBe('Idempotency-Key');
  });

  it('creates and persists installation client id on first visit', () => {
    const first = getOrCreateInstallationClientId();
    expect(first).toMatch(UUID_PATTERN);
    expect(localStorage.getItem(DMC_INSTALLATION_ID_STORAGE_KEY)).toBe(first);

    resetInstallationClientIdCacheForTests();
    const second = getOrCreateInstallationClientId();
    expect(second).toBe(first);
  });

  it('regenerates and persists valid UUID when localStorage value is corrupt', () => {
    localStorage.setItem(DMC_INSTALLATION_ID_STORAGE_KEY, 'not-a-valid-uuid');

    const id = getOrCreateInstallationClientId();

    expect(id).toMatch(UUID_PATTERN);
    expect(id).not.toBe('not-a-valid-uuid');
    expect(localStorage.getItem(DMC_INSTALLATION_ID_STORAGE_KEY)).toBe(id);
  });

  it('buildApiHeaders sets WEB client type and non-anonymous client id', () => {
    const headers = buildApiHeaders();
    expect(headers.get(DMC_CLIENT_TYPE_HEADER)).toBe(DMC_CLIENT_TYPE);
    expect(headers.get(DMC_CLIENT_ID_HEADER)).toMatch(UUID_PATTERN);
    expect(headers.get(DMC_CLIENT_ID_HEADER)).not.toBe('anonymous');
  });

  it('buildApiHeaders merges caller-provided headers', () => {
    const headers = buildApiHeaders({ 'X-Custom': 'value' });
    expect(headers.get('X-Custom')).toBe('value');
    expect(headers.get(DMC_CLIENT_TYPE_HEADER)).toBe(DMC_CLIENT_TYPE);
    expect(headers.get(DMC_CLIENT_ID_HEADER)).toMatch(UUID_PATTERN);
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    resetInstallationClientIdCacheForTests();
    requestMock.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
    resetInstallationClientIdCacheForTests();
  });

  it('sends WEB headers and Idempotency-Key on POST', async () => {
    requestMock.mockResolvedValue({
      status: 200,
      data: JSON.stringify({ success: true, data: { id: 1 } }),
      headers: { 'content-type': 'application/json' },
    });

    const { apiRequestData } = await import('./client');
    const result = await apiRequestData<{ id: number }>('/api/v2/devices/', {
      method: 'POST',
      body: { name: 'Test' },
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result).toEqual({ id: 1 });
    expect(requestMock).toHaveBeenCalledOnce();

    const [config] = requestMock.mock.calls[0] as [
      { headers: Record<string, string>; data: string; method: string },
    ];
    expect(config.method).toBe('POST');
    expect(config.data).toBe(JSON.stringify({ name: 'Test' }));
    expect(getHeaderValue(config.headers, DMC_CLIENT_TYPE_HEADER)).toBe(DMC_CLIENT_TYPE);
    expect(getHeaderValue(config.headers, DMC_CLIENT_ID_HEADER)).toMatch(UUID_PATTERN);
    expect(getHeaderValue(config.headers, DMC_CLIENT_ID_HEADER)).not.toBe('anonymous');
    expect(getHeaderValue(config.headers, IDEMPOTENCY_KEY_HEADER)).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('does not send Idempotency-Key on GET', async () => {
    requestMock.mockResolvedValue({
      status: 200,
      data: JSON.stringify({ success: true, data: [] }),
      headers: { 'content-type': 'application/json' },
    });

    const { apiRequestData } = await import('./client');
    await apiRequestData('/api/v2/devices/', { method: 'GET' });

    const [config] = requestMock.mock.calls[0] as [{ headers: Record<string, string> }];
    expect(getHeaderValue(config.headers, DMC_CLIENT_TYPE_HEADER)).toBe(DMC_CLIENT_TYPE);
    expect(getHeaderValue(config.headers, DMC_CLIENT_ID_HEADER)).toMatch(UUID_PATTERN);
    expect(getHeaderValue(config.headers, IDEMPOTENCY_KEY_HEADER)).toBeUndefined();
  });

  it('throws ApiError on non-2xx response (transport parity)', async () => {
    requestMock.mockResolvedValue({
      status: 500,
      data: JSON.stringify({ success: false, data: 'ERR_MSG' }),
      headers: { 'content-type': 'application/json' },
    });

    const { ApiError, apiRequestData } = await import('./client');

    try {
      await apiRequestData('/api/v2/devices/', {
        method: 'POST',
        body: { name: 'Test' },
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      });
      throw new Error('Expected apiRequestData to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
      expect(err).toHaveProperty('message', 'ERR_MSG');
    }
  });

  it('throws ApiError on envelope success:false (HTTP 200)', async () => {
    requestMock.mockResolvedValue({
      status: 200,
      data: JSON.stringify({ success: false, data: 'BAD_ENVELOPE' }),
      headers: { 'content-type': 'application/json' },
    });

    const { ApiError, apiRequestData } = await import('./client');

    try {
      await apiRequestData('/api/v2/devices/', { method: 'GET' });
      throw new Error('Expected apiRequestData to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect(err).toHaveProperty('message', 'BAD_ENVELOPE');
    }
  });
});

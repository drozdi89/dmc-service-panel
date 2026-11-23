import type { ApiEnvelope } from '../types/listQuery';
import {
  buildApiHeaders,
  consumeIdempotencyKeyForGet,
  createIdempotencyKey,
  IDEMPOTENCY_KEY_HEADER,
  requiresIdempotencyKey,
  stashIdempotencyKeyForFollowUpGet,
} from './headers';
import { getHttpClient } from './http';

/** Options for API requests. */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /**
   * Optional Idempotency-Key. Auto-generated for POST/PATCH/PUT/DELETE.
   * On GET, also applied when set explicitly or when linked from a prior PATCH/PUT on the same URL.
   */
  idempotencyKey?: string;
  /** Query parameters appended to the URL. */
  params?: Record<
    string,
    string | number | boolean | undefined | null | (string | number)[]
  >;
  /** JSON-serializable request body. */
  body?: unknown;
}

/** API client error with HTTP status and parsed body. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  /**
   * Creates an API error from HTTP response details.
   *
   * @param status - HTTP status code.
   * @param message - Human-readable message.
   * @param body - Parsed response body when available.
   */
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Resolves API base URL: explicit env or same-origin (Vite proxy in dev).
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return configured && configured.length > 0 ? configured.replace(/\/$/, '') : '';
}

/**
 * Builds a URL with optional query parameters.
 *
 * @param path - API path starting with `/`.
 * @param params - Query parameters to append.
 */
export function buildUrl(
  path: string,
  params?: ApiRequestOptions['params'],
): string {
  const base = getApiBaseUrl();
  const url = new URL(`${base}${path}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.pathname + url.search;
}

/**
 * Performs a typed fetch against the DMC API with WEB client headers.
 *
 * @param path - API path (e.g. `/api/v2/devices/`).
 * @param options - Request options including body and idempotency key.
 * @returns Parsed JSON response body.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { params, body, idempotencyKey, headers, method = 'GET', ...rest } = options;
  const normalizedMethod = method.toUpperCase();

  const requestUrl = buildUrl(path, params);
  const requestHeaders = buildApiHeaders(headers);

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let resolvedIdempotencyKey = idempotencyKey;
  if (requiresIdempotencyKey(normalizedMethod)) {
    resolvedIdempotencyKey = idempotencyKey ?? createIdempotencyKey();
    if (normalizedMethod === 'PATCH' || normalizedMethod === 'PUT') {
      stashIdempotencyKeyForFollowUpGet(requestUrl, resolvedIdempotencyKey);
    }
  } else if (normalizedMethod === 'GET') {
    resolvedIdempotencyKey =
      idempotencyKey ?? consumeIdempotencyKeyForGet(requestUrl);
  }

  if (resolvedIdempotencyKey !== undefined) {
    requestHeaders.set(IDEMPOTENCY_KEY_HEADER, resolvedIdempotencyKey);
  }

  const response = await getHttpClient().request<unknown>({
    ...rest,
    url: requestUrl,
    method: normalizedMethod,
    headers: Object.fromEntries(requestHeaders.entries()),
    data: body !== undefined ? JSON.stringify(body) : undefined,
    responseType: 'text',
    transformResponse: (value) => value,
    validateStatus: () => true,
    signal: options.signal ?? undefined,
  });

  const parsed = parseApiResponseBody(
    response.data,
    typeof response.headers['content-type'] === 'string'
      ? response.headers['content-type']
      : undefined,
  );

  if (response.status < 200 || response.status >= 300) {
    const message =
      typeof parsed === 'object' &&
      parsed !== null &&
      'data' in parsed &&
      typeof (parsed as ApiEnvelope<unknown>).data === 'string'
        ? (parsed as ApiEnvelope<string>).data
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, message, parsed);
  }

  return parsed as T;
}

/**
 * Performs a v2 envelope request and returns the inner `data` field.
 *
 * @param path - API path.
 * @param options - Request options.
 */
export async function apiRequestData<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const envelope = await apiRequest<ApiEnvelope<T>>(path, options);
  if (!envelope.success) {
    throw new ApiError(400, String(envelope.data), envelope);
  }
  return envelope.data;
}

/**
 * Parses an API response body using the server content type.
 *
 * @param rawBody - Raw response text returned by axios.
 * @param contentType - Response content type header.
 * @returns Parsed JSON payload, string body, or null for empty responses.
 */
function parseApiResponseBody(rawBody: unknown, contentType?: string): unknown {
  if (rawBody === '' || rawBody === null || rawBody === undefined) {
    return null;
  }

  if (typeof rawBody !== 'string') {
    return rawBody;
  }

  if (contentType?.includes('application/json')) {
    return JSON.parse(rawBody) as unknown;
  }

  return rawBody;
}

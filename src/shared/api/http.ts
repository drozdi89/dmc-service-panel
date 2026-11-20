import axios, { type AxiosInstance } from 'axios';

/**
 * Resolves API base URL: explicit env or same-origin (Vite proxy in dev).
 * Mirrors `getApiBaseUrl` in `client.ts` to avoid a circular import once
 * `apiRequest` switches onto this transport.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return configured && configured.length > 0 ? configured.replace(/\/$/, '') : '';
}

const baseURL = resolveApiBaseUrl();

/**
 * Singleton axios instance for internal `shared/api` transport.
 *
 * No JWT refresh, localStorage tokens, auth interceptors, or hard redirects.
 * WEB client headers and idempotency remain the responsibility of `apiRequest`.
 */
export const http: AxiosInstance = axios.create({
  baseURL: baseURL.length > 0 ? baseURL : undefined,
});

/**
 * Returns the shared axios HTTP client.
 *
 * @returns Singleton `AxiosInstance` created via `axios.create()`.
 */
export function getHttpClient(): AxiosInstance {
  return http;
}

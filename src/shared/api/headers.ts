/** HTTP methods that require Idempotency-Key for WEB client. */
export const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Client type header value for Web UI. */
export const DMC_CLIENT_TYPE = 'WEB';

/** Header name for client type identification. */
export const DMC_CLIENT_TYPE_HEADER = 'dmc-client-type';

/** Header name for stable Web UI installation identity. */
export const DMC_CLIENT_ID_HEADER = 'dmc-client-id';

/** localStorage key for persisted Web UI installation id. */
export const DMC_INSTALLATION_ID_STORAGE_KEY = 'dmc-installation-id';

/** Header name for idempotent mutations. */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedInstallationClientId: string | null = null;

/**
 * Reads a persisted installation id from localStorage when available.
 *
 * @returns Stored id or null when missing or storage is unavailable.
 */
function readStoredInstallationId(): string | null {
  try {
    const stored = localStorage.getItem(DMC_INSTALLATION_ID_STORAGE_KEY)?.trim();
    return stored && stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Persists installation id to localStorage (best effort).
 *
 * @param id - Stable client id to store.
 */
function writeStoredInstallationId(id: string): void {
  try {
    localStorage.setItem(DMC_INSTALLATION_ID_STORAGE_KEY, id);
  } catch {
    // Private mode or blocked storage — session cache still applies.
  }
}

/**
 * Returns a stable non-anonymous id for this browser installation.
 *
 * Reuses `dmc-installation-id` from localStorage or creates a UUID on first visit.
 *
 * @returns Non-empty client id suitable for `dmc-client-id` header.
 */
export function getOrCreateInstallationClientId(): string {
  if (cachedInstallationClientId !== null) {
    return cachedInstallationClientId;
  }

  const stored = readStoredInstallationId();
  if (stored !== null && UUID_V4_PATTERN.test(stored)) {
    cachedInstallationClientId = stored;
    return stored;
  }

  const created = crypto.randomUUID();
  writeStoredInstallationId(created);
  cachedInstallationClientId = created;
  return created;
}

/**
 * Builds default DMC headers for Web UI API requests.
 *
 * @param init - Optional existing headers to merge.
 * @returns Headers with `dmc-client-type` and `dmc-client-id` set.
 */
export function buildApiHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set(DMC_CLIENT_TYPE_HEADER, DMC_CLIENT_TYPE);
  headers.set(DMC_CLIENT_ID_HEADER, getOrCreateInstallationClientId());
  return headers;
}

/**
 * Clears in-memory installation id cache (unit tests only).
 *
 * @internal
 */
export function resetInstallationClientIdCacheForTests(): void {
  cachedInstallationClientId = null;
}

/**
 * Generates a new UUID for Idempotency-Key header.
 *
 * @returns UUID string suitable for mutation retries.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Returns true when the HTTP method requires Idempotency-Key.
 *
 * @param method - HTTP method name.
 */
export function requiresIdempotencyKey(method: string): boolean {
  return IDEMPOTENT_METHODS.has(method.toUpperCase());
}

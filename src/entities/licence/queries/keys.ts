/**
 * Root prefix for all licence / client React Query keys.
 * Invalidate with `{ queryKey: LICENCE_QUERY_ROOT }` to clear the whole group.
 */
export const LICENCE_QUERY_ROOT = ['licences'] as const;

/**
 * DMC clients entry for {@link factoryQuery} (list / lookup / detail scopes appended).
 * Keys: `['licences', 'clients', 'list'|'lookup'|'detail', …]`.
 */
export const CLIENTS_QUERY_ENTRY = [...LICENCE_QUERY_ROOT, 'clients'] as const;

/** Registered clients with license metadata (`GET /client_licencing/registered`). */
export const REGISTERED_CLIENTS_QUERY_KEY = [
  ...LICENCE_QUERY_ROOT,
  'registered',
] as const;

/** MACT licences snapshot via licence proxy. */
export const MACT_LICENCES_QUERY_KEY = [
  ...LICENCE_QUERY_ROOT,
  'mact',
  'licences',
] as const;

/** MACT subscription snapshot via licence proxy. */
export const MACT_SUBSCRIPTION_QUERY_KEY = [
  ...LICENCE_QUERY_ROOT,
  'mact',
  'subscription',
] as const;

/** MACT personal account URL via licence proxy. */
export const MACT_PERSONAL_ACCOUNT_QUERY_KEY = [
  ...LICENCE_QUERY_ROOT,
  'mact',
  'personal-account',
] as const;

import { apiRequestData } from '@/shared/api';
import { fetchPaginatedList } from '@/shared/api/listQuery';
import type { ListQueryParams, PaginatedResponse } from '@/shared/types/listQuery';
import type {
  DmcClient,
  MactLicenceList,
  MactPersonalAccount,
  MactSubscription,
  RegisteredClient,
} from '../model/types';

export const CLIENTS_LIST_PATH = '/api/v2/clients/';
const CLIENTS_LOOKUP_PATH = '/api/v2/clients/lookup';
const REGISTERED_PATH = '/api/v2/client_licencing/registered';
const LICENCE_PROXY_BASE = '/api/v2/licence_proxy';

/**
 * Fetches paginated DMC clients (List Query Contract).
 */
export async function fetchClients(
  params: ListQueryParams,
): Promise<PaginatedResponse<DmcClient>> {
  return fetchPaginatedList<DmcClient>(CLIENTS_LIST_PATH, params);
}

/**
 * Lookup-select fetcher for DMC clients (`GET /api/v2/clients/lookup`).
 *
 * @param params - size, number, q (List Query Contract subset).
 */
export async function fetchClientsLookup(
  params: ListQueryParams,
): Promise<PaginatedResponse<DmcClient>> {
  return fetchPaginatedList<DmcClient>(CLIENTS_LOOKUP_PATH, params);
}

/**
 * Fetches a single DMC client by id.
 *
 * @param clientId - Client primary key (`id_clients`).
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export async function fetchClientById(
  clientId: string,
  signal?: AbortSignal,
): Promise<DmcClient> {
  return apiRequestData<DmcClient>(
    `${CLIENTS_LIST_PATH}${encodeURIComponent(clientId)}`,
    { signal },
  );
}

/** Returns registered clients with license metadata. */
export async function fetchRegisteredClients(): Promise<RegisteredClient[]> {
  return apiRequestData<RegisteredClient[]>(REGISTERED_PATH);
}

/** Refreshes MACT licence lists via server-side proxy. */
export async function refreshMactLicences(
  pageSize = 50,
): Promise<MactLicenceList> {
  return apiRequestData<MactLicenceList>(`${LICENCE_PROXY_BASE}/licences`, {
    params: { page_size: pageSize },
  });
}

/** Refreshes MACT subscription info via server-side proxy. */
export async function refreshMactSubscription(): Promise<MactSubscription> {
  return apiRequestData<MactSubscription>(`${LICENCE_PROXY_BASE}/subscription`);
}

/** Fetches MACT personal account URL via server-side proxy. */
export async function fetchMactPersonalAccount(): Promise<MactPersonalAccount> {
  return apiRequestData<MactPersonalAccount>(
    `${LICENCE_PROXY_BASE}/personal_account`,
  );
}

/** Registers or updates a client license (idempotent POST). */
export async function registerClientLicense(payload: {
  client_id: string;
  licence_key: string;
  valid_until: string;
}): Promise<unknown> {
  return apiRequestData('/api/v2/client_licencing/register', {
    method: 'POST',
    body: payload,
  });
}

/** Removes client license registration (idempotent DELETE). */
export async function unregisterClientLicense(clientId: string): Promise<unknown> {
  return apiRequestData(`/api/v2/client_licencing/register/${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
  });
}

/** Deletes DMC client records by id list (idempotent DELETE). */
export async function deleteClients(clientIds: string[]): Promise<unknown> {
  return apiRequestData(CLIENTS_LIST_PATH, {
    method: 'DELETE',
    body: { id_clients: clientIds },
  });
}

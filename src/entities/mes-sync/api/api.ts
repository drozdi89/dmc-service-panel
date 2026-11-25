import { apiRequestData, createIdempotencyKey } from '@/shared/api';
import type {
  CreateMesSyncBindingPayload,
  MesSyncBinding,
  MesSyncBindingCreated,
  MesSyncServerSettings,
  NotifyCredentials,
  UpdateMesSyncBindingLinesPayload,
  UpdateMesSyncServerSettingsPayload,
} from '../model/types';

const MES_SYNC_SERVER_PATH = '/api/v2/service_config/mes_sync/server';
const MES_SYNC_BINDINGS_PATH = '/api/v2/service_config/mes_sync/bindings';
const NOTIFY_CREDENTIALS_PATH = '/api/v2/service_config/notify_credentials/';

/**
 * Loads singleton MES Sync server settings (`server_node_id`).
 */
export async function fetchMesSyncServerSettings(
  signal?: AbortSignal,
): Promise<MesSyncServerSettings> {
  return apiRequestData<MesSyncServerSettings>(MES_SYNC_SERVER_PATH, { signal });
}

/**
 * Updates singleton MES Sync server settings.
 */
export async function updateMesSyncServerSettings(
  payload: UpdateMesSyncServerSettingsPayload,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<MesSyncServerSettings> {
  return apiRequestData<MesSyncServerSettings>(MES_SYNC_SERVER_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Lists edge credential bindings (optionally including revoked).
 */
export async function fetchMesSyncBindings(
  includeRevoked = true,
  signal?: AbortSignal,
): Promise<MesSyncBinding[]> {
  return apiRequestData<MesSyncBinding[]>(MES_SYNC_BINDINGS_PATH, {
    params: { include_revoked: includeRevoked },
    signal,
  });
}

/**
 * Creates a binding; response includes one-time plaintext token.
 */
export async function createMesSyncBinding(
  payload: CreateMesSyncBindingPayload,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<MesSyncBindingCreated> {
  return apiRequestData<MesSyncBindingCreated>(MES_SYNC_BINDINGS_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Replaces authorized line ids on an active binding.
 */
export async function updateMesSyncBindingLines(
  bindingId: string,
  payload: UpdateMesSyncBindingLinesPayload,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<MesSyncBinding> {
  return apiRequestData<MesSyncBinding>(
    `${MES_SYNC_BINDINGS_PATH}/${encodeURIComponent(bindingId)}`,
    {
      method: 'PATCH',
      body: payload,
      idempotencyKey,
    },
  );
}

/**
 * Soft-revokes a binding.
 */
export async function revokeMesSyncBinding(
  bindingId: string,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<void> {
  await apiRequestData(`${MES_SYNC_BINDINGS_PATH}/${encodeURIComponent(bindingId)}`, {
    method: 'DELETE',
    idempotencyKey,
  });
}

/**
 * Rotates bearer token; response includes one-time plaintext token.
 */
export async function rotateMesSyncBinding(
  bindingId: string,
  idempotencyKey: string = createIdempotencyKey(),
): Promise<MesSyncBindingCreated> {
  return apiRequestData<MesSyncBindingCreated>(
    `${MES_SYNC_BINDINGS_PATH}/${encodeURIComponent(bindingId)}/rotate`,
    {
      method: 'POST',
      idempotencyKey,
    },
  );
}

/**
 * Loads notify credentials (read-only in web admin).
 */
export async function fetchNotifyCredentials(
  signal?: AbortSignal,
): Promise<NotifyCredentials> {
  return apiRequestData<NotifyCredentials>(NOTIFY_CREDENTIALS_PATH, { signal });
}

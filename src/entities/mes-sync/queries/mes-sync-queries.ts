import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  useInvalidatingMutation,
  type EntityMutationOptions,
} from '@/shared/queries';
import {
  createMesSyncBinding,
  fetchMesSyncBindings,
  fetchMesSyncServerSettings,
  fetchNotifyCredentials,
  revokeMesSyncBinding,
  rotateMesSyncBinding,
  updateMesSyncBindingLines,
  updateMesSyncServerSettings,
} from '../api/api';
import type {
  CreateMesSyncBindingPayload,
  MesSyncBinding,
  MesSyncBindingCreated,
  MesSyncServerSettings,
  NotifyCredentials,
  UpdateMesSyncBindingLinesPayload,
} from '../model/types';
import { mesSyncKeys } from './keys';

/** Loads MES Sync server settings. */
export function useMesSyncServerQuery(
  enabled = true,
): UseQueryResult<MesSyncServerSettings, Error> {
  return useQuery({
    queryKey: mesSyncKeys.server(),
    queryFn: ({ signal }) => fetchMesSyncServerSettings(signal),
    enabled,
  });
}

/** Lists edge bindings (includes revoked). */
export function useMesSyncBindingsQuery(
  enabled = true,
): UseQueryResult<MesSyncBinding[], Error> {
  return useQuery({
    queryKey: mesSyncKeys.bindings(),
    queryFn: ({ signal }) => fetchMesSyncBindings(true, signal),
    enabled,
  });
}

/** Notify credentials (read-only). */
export function useNotifyCredentialsQuery(
  enabled = true,
): UseQueryResult<NotifyCredentials, Error> {
  return useQuery({
    queryKey: mesSyncKeys.notify(),
    queryFn: ({ signal }) => fetchNotifyCredentials(signal),
    enabled,
  });
}

/** Persists server_node_id (e.g. auto-ensure). */
export function useUpdateMesSyncServerMutation(
  options?: EntityMutationOptions<MesSyncServerSettings, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [mesSyncKeys.server()],
    mutationFn: (serverNodeId: string) =>
      updateMesSyncServerSettings({ server_node_id: serverNodeId }),
  });
}

/** Creates a binding; returns one-time token. */
export function useCreateMesSyncBindingMutation(
  options?: EntityMutationOptions<MesSyncBindingCreated, CreateMesSyncBindingPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [mesSyncKeys.bindings()],
    mutationFn: (payload: CreateMesSyncBindingPayload) => createMesSyncBinding(payload),
  });
}

/** Variables for update binding lines. */
export interface UpdateMesSyncBindingLinesVariables {
  bindingId: string;
  payload: UpdateMesSyncBindingLinesPayload;
}

/** Updates authorized lines on a binding. */
export function useUpdateMesSyncBindingLinesMutation(
  options?: EntityMutationOptions<MesSyncBinding, UpdateMesSyncBindingLinesVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [mesSyncKeys.bindings()],
    mutationFn: ({ bindingId, payload }: UpdateMesSyncBindingLinesVariables) =>
      updateMesSyncBindingLines(bindingId, payload),
  });
}

/** Soft-revokes a binding. */
export function useRevokeMesSyncBindingMutation(
  options?: EntityMutationOptions<void, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [mesSyncKeys.bindings()],
    mutationFn: (bindingId: string) => revokeMesSyncBinding(bindingId),
  });
}

/** Rotates binding token; returns one-time token. */
export function useRotateMesSyncBindingMutation(
  options?: EntityMutationOptions<MesSyncBindingCreated, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [mesSyncKeys.bindings()],
    mutationFn: (bindingId: string) => rotateMesSyncBinding(bindingId),
  });
}

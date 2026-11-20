import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  createCrptOrganization,
  createDataMarkCredentials,
  createLineOptions,
  createUtraceSettings,
  deleteCrptOrganizations,
  deleteDataMarkCredentials,
  deleteUtraceSettings,
  fetchOneCExchangeServers,
  saveAutoorderOptions,
  saveAutosendSettings,
  saveDataMarkCredentials,
  saveOneCExchangeSettings,
  saveOrgCrptTemplateIdx,
  saveUtraceSettings,
  saveWmsEfkoSettings,
  testWmsEfkoConnection,
  updateCrptOrganization,
  updateLineOptions,
} from '../api/api';
import type {
  AutoorderOptions,
  AutosendSettingsPayload,
  CrptOrganization,
  DataMarkCredentials,
  LineTaskTypeRow,
  OneCExchangeServersResponse,
  OneCExchangeSettingsPayload,
  UtraceSettings,
  WmsEfkoSettingsPayload,
} from '../model/types';
import {
  AUTOORDER_QUERY_KEY,
  AUTOSEND_QUERY_KEY,
  CRPT_ORGS_QUERY_KEY,
  DATAMARK_QUERY_KEY,
  LINE_TASK_TYPES_QUERY_KEY,
  ONE_C_EXCHANGE_QUERY_KEY,
  UTRACE_QUERY_KEY,
  WMS_EFKO_QUERY_KEY,
} from './keys';

/** Variables for {@link useSaveDataMarkCredentialsMutation}. */
export interface SaveDataMarkCredentialsVariables {
  /** UNP of the stored row; PUT when set, POST otherwise. */
  currentUnp?: string | null;
  credentials: DataMarkCredentials;
}

/** Creates or updates DataMark credentials. */
export function useSaveDataMarkCredentialsMutation(
  options?: EntityMutationOptions<unknown, SaveDataMarkCredentialsVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [DATAMARK_QUERY_KEY],
    mutationFn: ({ currentUnp, credentials }: SaveDataMarkCredentialsVariables) => {
      const key = createIdempotencyKey();
      return currentUnp
        ? saveDataMarkCredentials(currentUnp, credentials, key)
        : createDataMarkCredentials(credentials, key);
    },
  });
}

/** Deletes DataMark credentials by UNP. */
export function useDeleteDataMarkCredentialsMutation(
  options?: EntityMutationOptions<string, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [DATAMARK_QUERY_KEY],
    mutationFn: (unp: string) => deleteDataMarkCredentials([unp], createIdempotencyKey()),
  });
}

/** Variables for {@link useSaveUtraceSettingsMutation}. */
export interface SaveUtraceSettingsVariables {
  /** INN of the stored row; PUT when set, POST otherwise. */
  currentInn?: string | null;
  settings: UtraceSettings;
}

/** Creates or updates Utrace settings. */
export function useSaveUtraceSettingsMutation(
  options?: EntityMutationOptions<unknown, SaveUtraceSettingsVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [UTRACE_QUERY_KEY],
    mutationFn: ({ currentInn, settings }: SaveUtraceSettingsVariables) => {
      const key = createIdempotencyKey();
      return currentInn
        ? saveUtraceSettings(currentInn, settings, key)
        : createUtraceSettings(settings, key);
    },
  });
}

/** Deletes all Utrace settings rows. */
export function useDeleteUtraceSettingsMutation(
  options?: EntityMutationOptions<{ deleted: number }, void>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [UTRACE_QUERY_KEY],
    mutationFn: () => deleteUtraceSettings(createIdempotencyKey()),
  });
}

/** Persists autoorder configuration. */
export function useSaveAutoorderOptionsMutation(
  options?: EntityMutationOptions<{ updated_products: number }, AutoorderOptions>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [AUTOORDER_QUERY_KEY],
    mutationFn: (payload: AutoorderOptions) =>
      saveAutoorderOptions(payload, createIdempotencyKey()),
  });
}

/** Persists composite autosend configuration. */
export function useSaveAutosendSettingsMutation(
  options?: EntityMutationOptions<
    Awaited<ReturnType<typeof saveAutosendSettings>>,
    AutosendSettingsPayload
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [AUTOSEND_QUERY_KEY],
    mutationFn: (payload: AutosendSettingsPayload) =>
      saveAutosendSettings(payload, createIdempotencyKey()),
  });
}

/** Upserts singleton 1C exchange settings. */
export function useSaveOneCExchangeSettingsMutation(
  options?: EntityMutationOptions<unknown, OneCExchangeSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [ONE_C_EXCHANGE_QUERY_KEY],
    mutationFn: (payload: OneCExchangeSettingsPayload) =>
      saveOneCExchangeSettings(payload, createIdempotencyKey()),
  });
}

/** Saves connection settings, then loads DMC servers list from 1C. */
export function useRefreshOneCExchangeServersMutation(
  options?: EntityMutationOptions<OneCExchangeServersResponse, OneCExchangeSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [ONE_C_EXCHANGE_QUERY_KEY],
    mutationFn: async (payload: OneCExchangeSettingsPayload) => {
      await saveOneCExchangeSettings(payload, createIdempotencyKey());
      return fetchOneCExchangeServers();
    },
  });
}

/** Upserts singleton WMS (Efko) settings. */
export function useSaveWmsEfkoSettingsMutation(
  options?: EntityMutationOptions<unknown, WmsEfkoSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [WMS_EFKO_QUERY_KEY],
    mutationFn: (payload: WmsEfkoSettingsPayload) =>
      saveWmsEfkoSettings(payload, createIdempotencyKey()),
  });
}

/** Saves MS SQL connection fields, then tests connectivity. */
export function useTestWmsEfkoConnectionMutation(
  options?: EntityMutationOptions<{ ok: boolean }, WmsEfkoSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [WMS_EFKO_QUERY_KEY],
    mutationFn: async (payload: WmsEfkoSettingsPayload) => {
      await saveWmsEfkoSettings(payload, createIdempotencyKey());
      return testWmsEfkoConnection(createIdempotencyKey());
    },
  });
}

/** Variables for {@link useSaveCrptOrganizationMutation}. */
export interface SaveCrptOrganizationVariables {
  mode: 'create' | 'edit';
  organization: CrptOrganization;
}

/** Result of {@link useSaveCrptOrganizationMutation}. */
export interface SaveCrptOrganizationResult {
  /** Organization saved, but `crpt_template_idx` (marking option) failed. */
  templateError: Error | null;
}

/**
 * Creates or updates a CRPT organization, then stores `crpt_template_idx`
 * through marking options (the organization endpoint does not accept it).
 */
export function useSaveCrptOrganizationMutation(
  options?: EntityMutationOptions<SaveCrptOrganizationResult, SaveCrptOrganizationVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [CRPT_ORGS_QUERY_KEY],
    mutationFn: async ({ mode, organization }: SaveCrptOrganizationVariables) => {
      const { crpt_template_idx: templateIdx, ...body } = organization;
      const key = createIdempotencyKey();
      if (mode === 'edit') {
        const { inn, ...updateBody } = body;
        await updateCrptOrganization(inn, updateBody, key);
      } else {
        await createCrptOrganization(body, key);
      }
      try {
        await saveOrgCrptTemplateIdx(body.inn, templateIdx ?? 0);
        return { templateError: null };
      } catch (error) {
        return { templateError: error instanceof Error ? error : new Error(String(error)) };
      }
    },
  });
}

/** Deletes a CRPT organization by INN. */
export function useDeleteCrptOrganizationMutation(
  options?: EntityMutationOptions<string, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [CRPT_ORGS_QUERY_KEY],
    mutationFn: (inn: string) => deleteCrptOrganizations([inn], createIdempotencyKey()),
  });
}

/**
 * Saves `reserve_disabled` for changed lines: PATCH existing line options,
 * POST defaults for lines without options.
 *
 * @returns Number of saved lines.
 */
export function useSaveLineTaskTypesMutation(
  options?: EntityMutationOptions<number, LineTaskTypeRow[]>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [LINE_TASK_TYPES_QUERY_KEY],
    mutationFn: async (changed: LineTaskTypeRow[]) => {
      await Promise.all(
        changed.map((row) => {
          const key = createIdempotencyKey();
          if (row.hasOptions) {
            return updateLineOptions(row.lineid, { reserve_disabled: row.reserve_disabled }, key);
          }
          return createLineOptions(
            {
              lineid: row.lineid,
              reserve_disabled: row.reserve_disabled,
              must_scan_before_start: false,
              cam_disable: false,
              cam_hide: false,
              ask_befor_task: false,
              control_task_date: false,
              validate_ean: false,
              can_add_task: false,
            },
            key,
          );
        }),
      );
      return changed.length;
    },
  });
}

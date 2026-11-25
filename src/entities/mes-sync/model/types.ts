import type { components } from '@/shared/api';

/** Binding metadata without bearer secret (list/GET). */
export type MesSyncBinding = components['schemas']['MesSyncBindingData'];

/** Binding returned once after create or rotate (includes plaintext token). */
export type MesSyncBindingCreated = components['schemas']['MesSyncBindingCreated'];

/** Singleton server-side MES Sync identity. */
export type MesSyncServerSettings = components['schemas']['MesSyncServerSettingsData'];

/** Create binding body. */
export type CreateMesSyncBindingPayload = components['schemas']['CreateBindingPayload'];

/** Patch binding lines body. */
export type UpdateMesSyncBindingLinesPayload = components['schemas']['UpdateBindingLinesPayload'];

/** PUT server settings body. */
export type UpdateMesSyncServerSettingsPayload =
  components['schemas']['UpdateServerSettingsPayload'];

/** Notify credentials (read-only in SP; rotation is desktop-only). */
export type NotifyCredentials = components['schemas']['NotifyCredentialsSchema'];

/** React Query entry for MES Sync admin. */
export const MES_SYNC_QUERY_ENTRY = ['mes-sync'] as const;

export const mesSyncKeys = {
  all: () => MES_SYNC_QUERY_ENTRY,
  server: () => [...MES_SYNC_QUERY_ENTRY, 'server'] as const,
  bindings: () => [...MES_SYNC_QUERY_ENTRY, 'bindings'] as const,
  notify: () => [...MES_SYNC_QUERY_ENTRY, 'notify'] as const,
};

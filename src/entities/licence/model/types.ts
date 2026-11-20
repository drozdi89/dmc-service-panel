import type { components } from '@/shared/api/types';

/** DMC client row from `GET /api/v2/clients/`. */
export type DmcClient = components['schemas']['GetClientsSchema'];

/** Client with license metadata from `GET /api/v2/client_licencing/registered`. */
export interface RegisteredClient {
  client_id: string;
  name: string;
  client_type: string;
  version: string;
  licence_key: string | null;
  last_session: string | null;
  valid_until: string | null;
}

/** Single MACT licence row from licence proxy. */
export interface MactLicenceInfo {
  client_id: string | null;
  is_active: boolean;
  valid_until: string;
  lic_type: string;
  pin: string;
  valid_days: number;
}

/** MACT licences snapshot from `GET /api/v2/licence_proxy/licences`. */
export interface MactLicenceList {
  used: MactLicenceInfo[];
  available: MactLicenceInfo[];
  org_lic_count: number;
}

/** MACT subscription snapshot from `GET /api/v2/licence_proxy/subscription`. */
export interface MactSubscription {
  is_valid: boolean;
  valid_to: string | null;
  valid_days: number;
}

/** Personal account URL from `GET /api/v2/licence_proxy/personal_account`. */
export interface MactPersonalAccount {
  url: string;
}

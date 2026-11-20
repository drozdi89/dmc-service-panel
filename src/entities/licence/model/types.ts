import type { components } from '@/shared/api';

/** DMC client row from `GET /api/v2/clients/`. */
export type DmcClient = components['schemas']['GetClientsSchema'];

/** Client with license metadata from `GET /api/v2/client_licencing/registered`. */
export type RegisteredClient = components['schemas']['RegisteredClientData'];

/** Single MACT licence row from licence proxy. */
export type MactLicenceInfo = components['schemas']['LicenceInfoResponse'];

/** MACT licences snapshot from `GET /api/v2/licence_proxy/licences`. */
export type MactLicenceList = components['schemas']['LicenceListResponse'];

/** MACT subscription snapshot from `GET /api/v2/licence_proxy/subscription`. */
export type MactSubscription = components['schemas']['SubscriptionResponse'];

/** Personal account URL from `GET /api/v2/licence_proxy/personal_account`. */
export type MactPersonalAccount = components['schemas']['MactPersonalAccountSchema'];

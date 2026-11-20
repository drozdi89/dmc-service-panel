import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/lib/factory-query';
import {
  CLIENTS_QUERY_ENTRY,
  LICENCE_QUERY_ROOT,
  MACT_LICENCES_QUERY_KEY,
  MACT_PERSONAL_ACCOUNT_QUERY_KEY,
  MACT_SUBSCRIPTION_QUERY_KEY,
  REGISTERED_CLIENTS_QUERY_KEY,
} from './keys';
import {
  clientQueries,
  mactLicencesQueryOptions,
  mactPersonalAccountQueryOptions,
  mactSubscriptionQueryOptions,
  registeredClientsQueryOptions,
} from './licence-queries';

describe('licence query keys', () => {
  it('uses licences root and clients list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'mgr' };

    expect(LICENCE_QUERY_ROOT).toEqual(['licences']);
    expect(CLIENTS_QUERY_ENTRY).toEqual(['licences', 'clients']);
    expect(clientQueries.keys.all()).toEqual(['licences', 'clients']);
    expect(clientQueries.keys.list()).toEqual([
      'licences',
      'clients',
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(clientQueries.keys.list(params)).toEqual([
      'licences',
      'clients',
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(clientQueries.keys.lookup()).toEqual([
      'licences',
      'clients',
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(clientQueries.keys.lookup(params)).toEqual([
      'licences',
      'clients',
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(clientQueries.keys.detail('client-1')).toEqual([
      'licences',
      'clients',
      FACTORY_QUERY_SCOPES.detail,
      'client-1',
    ]);
  });

  it('exposes stable keys for registered and MACT reads', () => {
    expect(REGISTERED_CLIENTS_QUERY_KEY).toEqual(['licences', 'registered']);
    expect(registeredClientsQueryOptions().queryKey).toEqual(
      REGISTERED_CLIENTS_QUERY_KEY,
    );

    expect(MACT_LICENCES_QUERY_KEY).toEqual(['licences', 'mact', 'licences']);
    expect(mactLicencesQueryOptions(50).queryKey).toEqual([
      'licences',
      'mact',
      'licences',
      50,
    ]);

    expect(MACT_SUBSCRIPTION_QUERY_KEY).toEqual([
      'licences',
      'mact',
      'subscription',
    ]);
    expect(mactSubscriptionQueryOptions().queryKey).toEqual(
      MACT_SUBSCRIPTION_QUERY_KEY,
    );

    expect(MACT_PERSONAL_ACCOUNT_QUERY_KEY).toEqual([
      'licences',
      'mact',
      'personal-account',
    ]);
    expect(mactPersonalAccountQueryOptions().queryKey).toEqual(
      MACT_PERSONAL_ACCOUNT_QUERY_KEY,
    );
  });
});

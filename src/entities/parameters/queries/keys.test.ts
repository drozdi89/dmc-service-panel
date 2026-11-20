import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/lib/factory-query';
import { factoryNumbersQueries } from './factory-numbers';
import {
  FACTORY_NUMBERS_QUERY_KEY,
  FTP_QUERY_KEY,
  PARAMETERS_QUERY_ROOT,
  SETTINGS_BUNDLE_QUERY_KEY,
  SLAVE_QUERY_KEY,
  TELE_BOT_QUERY_KEY,
  WATCHDOG_QUERY_KEY,
  markingOptionValueQueryKey,
} from './keys';

describe('parameters query keys', () => {
  it('nests all scopes under parameters root', () => {
    expect(PARAMETERS_QUERY_ROOT).toEqual(['parameters']);
    expect(SETTINGS_BUNDLE_QUERY_KEY).toEqual(['parameters', 'settings-bundle']);
    expect(SLAVE_QUERY_KEY).toEqual(['parameters', 'slave']);
    expect(TELE_BOT_QUERY_KEY).toEqual(['parameters', 'tele-bot']);
    expect(FTP_QUERY_KEY).toEqual(['parameters', 'ftp']);
    expect(WATCHDOG_QUERY_KEY).toEqual(['parameters', 'watchdog']);
    expect(FACTORY_NUMBERS_QUERY_KEY).toEqual(['parameters', 'factory-numbers']);
  });

  it('builds marking option value key with option name', () => {
    expect(markingOptionValueQueryKey('dmc_comp_size')).toEqual([
      'parameters',
      'marking-option-value',
      'dmc_comp_size',
    ]);
  });
});

describe('factoryNumbersQueries keys', () => {
  it('uses parameters/factory-numbers entry with list / lookup scopes', () => {
    const params = { size: 20, number: 0, q: '12' };

    expect(factoryNumbersQueries.keys.all()).toEqual(FACTORY_NUMBERS_QUERY_KEY);
    expect(factoryNumbersQueries.keys.list()).toEqual([
      ...FACTORY_NUMBERS_QUERY_KEY,
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(factoryNumbersQueries.keys.list(params)).toEqual([
      ...FACTORY_NUMBERS_QUERY_KEY,
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(factoryNumbersQueries.keys.lookup()).toEqual([
      ...FACTORY_NUMBERS_QUERY_KEY,
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(factoryNumbersQueries.keys.lookup(params)).toEqual([
      ...FACTORY_NUMBERS_QUERY_KEY,
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
  });
});

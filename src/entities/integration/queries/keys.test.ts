import { describe, expect, it } from 'vitest';
import {
  AUTOORDER_QUERY_KEY,
  AUTOSEND_PRODUCTS_QUERY_KEY,
  AUTOSEND_QUERY_KEY,
  CRPT_ORGS_QUERY_KEY,
  CRPT_TEMPLATES_QUERY_KEY,
  DATAMARK_QUERY_KEY,
  INTEGRATIONS_QUERY_ROOT,
  LINE_TASK_TYPES_QUERY_KEY,
  ONE_C_EXCHANGE_QUERY_KEY,
  SERVER_ACTIVATION_QUERY_KEY,
  UTRACE_QUERY_KEY,
  WMS_EFKO_QUERY_KEY,
  crptOrganizationsQueries,
  lineOptionsQueryKey,
} from './index';

describe('integration query keys', () => {
  it('uses integrations root prefix for all audited keys', () => {
    const keys = [
      CRPT_ORGS_QUERY_KEY,
      SERVER_ACTIVATION_QUERY_KEY,
      DATAMARK_QUERY_KEY,
      UTRACE_QUERY_KEY,
      AUTOORDER_QUERY_KEY,
      AUTOSEND_QUERY_KEY,
      AUTOSEND_PRODUCTS_QUERY_KEY,
      CRPT_TEMPLATES_QUERY_KEY,
      LINE_TASK_TYPES_QUERY_KEY,
      ONE_C_EXCHANGE_QUERY_KEY,
      WMS_EFKO_QUERY_KEY,
      lineOptionsQueryKey(42),
    ];
    for (const key of keys) {
      expect(key[0]).toBe(INTEGRATIONS_QUERY_ROOT[0]);
      expect(key[0]).toBe('integrations');
    }
  });

  it('matches legacy feature key literals for plain settings queries', () => {
    expect(SERVER_ACTIVATION_QUERY_KEY).toEqual(['integrations', 'server-activation']);
    expect(DATAMARK_QUERY_KEY).toEqual(['integrations', 'datamark']);
    expect(UTRACE_QUERY_KEY).toEqual(['integrations', 'utrace']);
    expect(AUTOORDER_QUERY_KEY).toEqual(['integrations', 'autoorder']);
    expect(AUTOSEND_QUERY_KEY).toEqual(['integrations', 'autosend']);
    expect(AUTOSEND_PRODUCTS_QUERY_KEY).toEqual(['integrations', 'autosend-products']);
    expect(CRPT_TEMPLATES_QUERY_KEY).toEqual(['integrations', 'crpt-templates']);
    expect(LINE_TASK_TYPES_QUERY_KEY).toEqual(['integrations', 'line-task-types']);
    expect(ONE_C_EXCHANGE_QUERY_KEY).toEqual(['integrations', 'one-c-exchange']);
    expect(WMS_EFKO_QUERY_KEY).toEqual(['integrations', 'wms-efko']);
  });

  it('exposes factory scopes under crpt-organizations entry', () => {
    expect(crptOrganizationsQueries.keys.all()).toEqual(CRPT_ORGS_QUERY_KEY);
    expect(crptOrganizationsQueries.keys.list()).toEqual([
      'integrations',
      'crpt-organizations',
      'list',
    ]);
    expect(crptOrganizationsQueries.keys.lookup()).toEqual([
      'integrations',
      'crpt-organizations',
      'lookup',
    ]);
    expect(crptOrganizationsQueries.keys.detail('7707083893')).toEqual([
      'integrations',
      'crpt-organizations',
      'detail',
      '7707083893',
    ]);
  });
});

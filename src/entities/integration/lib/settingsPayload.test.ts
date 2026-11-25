import { describe, expect, it } from 'vitest';
import type { OneCExchangeSettings, WmsEfkoSettingsPayload } from '../model/types';
import {
  buildOneCExchangePayload,
  validateOneCConnection,
  validateOneCExchangeSettings,
} from './oneCExchangeSettings';
import {
  buildWmsEfkoPayload,
  validateWmsEfkoSettings,
  validateWmsMssqlConnection,
} from './wmsEfkoSettings';

const wmsValues = {
  enabled: true,
  mssql_host: ' sql.local ',
  mssql_port: 1433,
  mssql_database: ' wms ',
  mssql_username: '',
  mssql_password: '  ',
  api_host: '',
  api_port: 0,
  line_filter_mode: 'all',
  line_ids: [],
} as unknown as WmsEfkoSettingsPayload;

describe('buildWmsEfkoPayload', () => {
  it('trims text, nulls empty fields and omits an empty password', () => {
    const payload = buildWmsEfkoPayload(wmsValues);

    expect(payload).toMatchObject({
      mssql_host: 'sql.local',
      mssql_database: 'wms',
      mssql_username: null,
      api_host: null,
      api_port: null,
      line_ids: [],
    });
    expect(payload).not.toHaveProperty('mssql_password');
  });

  it('keeps a non-empty password', () => {
    expect(buildWmsEfkoPayload({ ...wmsValues, mssql_password: ' secret ' }).mssql_password).toBe(
      'secret',
    );
  });
});

describe('validateWmsEfkoSettings', () => {
  it('skips validation when disabled', () => {
    expect(validateWmsEfkoSettings({ ...wmsValues, enabled: false, mssql_host: '' })).toBeNull();
  });

  it('requires MS SQL host and database', () => {
    expect(validateWmsMssqlConnection({ mssql_host: '', mssql_database: 'x' })).toBe(
      'Укажите хост MS SQL WMS.',
    );
    expect(validateWmsMssqlConnection({ mssql_host: 'x', mssql_database: ' ' })).toBe(
      'Укажите имя базы данных MS SQL WMS.',
    );
  });

  it('requires lines for include/exclude filters', () => {
    expect(
      validateWmsEfkoSettings({ ...wmsValues, line_filter_mode: 'include', line_ids: [] }),
    ).toBe('Выберите хотя бы одну линию для режима фильтра «Только выбранные линии».');
    expect(
      validateWmsEfkoSettings({ ...wmsValues, line_filter_mode: 'include', line_ids: [1] }),
    ).toBeNull();
  });
});

const loaded = {
  enabled: true,
  base_url: 'https://1c',
  username: 'user',
  password: 'stored',
  srv_id: 5,
} as OneCExchangeSettings;

describe('buildOneCExchangePayload', () => {
  it('reuses the stored password when the field is empty', () => {
    const payload = buildOneCExchangePayload(
      { ...loaded, password: '', base_url: ' https://new ' },
      { loaded, passwordConfigured: true },
    );
    expect(payload).toEqual({
      enabled: true,
      base_url: 'https://new',
      username: 'user',
      srv_id: 5,
      password: 'stored',
    });
  });

  it('preserves stored flags on server list refresh', () => {
    const payload = buildOneCExchangePayload(
      { ...loaded, enabled: false, srv_id: null, password: 'new' },
      { loaded, passwordConfigured: true },
      { preserveFlags: true },
    );
    expect(payload).toMatchObject({ enabled: true, srv_id: 5, password: 'new' });
  });
});

describe('validateOneCExchangeSettings', () => {
  it('requires a password when none is configured', () => {
    expect(
      validateOneCConnection({ ...loaded, password: '' }, { loaded, passwordConfigured: false }),
    ).toBe('Укажите пароль для Basic Auth.');
  });

  it('requires srv_id when enabled', () => {
    expect(
      validateOneCExchangeSettings(
        { ...loaded, srv_id: null },
        { loaded, passwordConfigured: true },
      ),
    ).toBe('Выберите сервер DMC (srv_id) или обновите список серверов.');
  });
});

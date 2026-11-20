import { describe, expect, it } from 'vitest';
import { parseTeleBotSetting } from './api';

describe('parseTeleBotSetting', () => {
  it('returns null for empty object', () => {
    expect(parseTeleBotSetting({})).toBeNull();
  });

  it('returns row from paginated response', () => {
    const row = { bot_setting_id: 1, api_token: 'token', is_activ: true };
    expect(
      parseTeleBotSetting({
        page: 1,
        next_page: 2,
        previous_page: 0,
        size: 50,
        total_records: 1,
        response: [row],
      }),
    ).toEqual(row);
  });

  it('returns direct row payload', () => {
    const row = { bot_setting_id: 2, api_token: 'abc', is_activ: false };
    expect(parseTeleBotSetting(row)).toEqual(row);
  });
});

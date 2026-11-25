import { describe, expect, it } from 'vitest';
import type { FtpConfiguration } from '../model/types';
import { normalizeFtpConfig } from './ftpConfig';

describe('normalizeFtpConfig', () => {
  it('fills connection defaults and marker file', () => {
    const result = normalizeFtpConfig({
      enabled: true,
      processed_file: '',
      connection: { host: 'ftp.local' },
    } as FtpConfiguration);

    expect(result.enabled).toBe(true);
    expect(result.processed_file).toBe('processed.txt');
    expect(result.connection).toMatchObject({ host: 'ftp.local', port: 21, home_dir: '' });
  });
});

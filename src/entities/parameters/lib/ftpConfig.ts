import type { FtpConfiguration } from '../model/types';

const DEFAULT_CONNECTION = {
  host: '',
  port: 21,
  username: '',
  password: '',
  home_dir: '',
  import_dir: '',
  export_dir: '',
};

/**
 * Normalizes FTP API payload for form fields.
 *
 * @param config - FTP configuration from API.
 */
export function normalizeFtpConfig(config: FtpConfiguration): FtpConfiguration {
  return {
    enabled: config.enabled,
    processed_file: config.processed_file || 'processed.txt',
    connection: { ...DEFAULT_CONNECTION, ...config.connection },
  };
}

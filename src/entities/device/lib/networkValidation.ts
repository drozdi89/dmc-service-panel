import { isSerialScale } from '../model/constants';
import type { DeviceType } from '../model/types';
import { validatePort } from '@/shared/validation/network';

/** Host field validation context (Qt `device_data_manager` / `libs.common` parity). */
export type HostValidationType =
  | DeviceType
  | 'sql_host'
  | 'divider_host'
  | 'controller_port';

const IP_REGEX =
  /^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/;

const IP_SEMICOLON_REGEX =
  /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:;[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?::[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])?)?$/;

const DOUBLE_IP_PORT_REGEX =
  /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{1,5})|([0-9]{1,4})))?(\+(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{1,5})|([0-9]{1,4})))?)?$/;

const COM_IP_PORT_REGEX =
  /^(COM[1-9][0-9]?|(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{1,5})|([0-9]{1,4})))?)$/;

const DIVIDER_HOST_REGEX = /^(COM[1-9][0-9]?|((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4})$/;

const HOST_PATTERNS: Record<HostValidationType, RegExp> = {
  camera: IP_SEMICOLON_REGEX,
  printer: DOUBLE_IP_PORT_REGEX,
  scale: IP_REGEX,
  controller: COM_IP_PORT_REGEX,
  divider: DIVIDER_HOST_REGEX,
  sql_host: IP_REGEX,
  divider_host: DIVIDER_HOST_REGEX,
  controller_port: COM_IP_PORT_REGEX,
};

const HOST_ERROR_MESSAGES: Record<HostValidationType, string> = {
  camera: 'Укажите IP или IP1;IP2',
  printer: 'Укажите IP или IP:port (для резервного — IP+IP)',
  scale: 'Укажите корректный IP-адрес',
  controller: 'Укажите COM или IP:port',
  divider: 'Укажите COM или IP-адрес',
  sql_host: 'Укажите корректный IP-адрес SQL-сервера',
  divider_host: 'Укажите COM или IP-адрес',
  controller_port: 'Укажите COM или IP:port',
};

/**
 * Validates a host / address string for the given device field type.
 *
 * @param type - Validation context (device type or dedicated field key).
 * @param value - Raw input value.
 * @returns Error message when invalid; `null` when valid or empty.
 */
export function validateHost(
  type: HostValidationType,
  value: string | null | undefined,
): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return null;
  }

  if (!HOST_PATTERNS[type].test(trimmed)) {
    return HOST_ERROR_MESSAGES[type];
  }

  return null;
}

/**
 * Ant Design Form rule factory for host fields.
 *
 * @param type - Host validation context.
 * @param required - Whether empty value should fail validation.
 */
export function hostFormRule(type: HostValidationType, required = false) {
  return {
    validator: async (_: unknown, value: string | null | undefined) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        if (required) {
          throw new Error(HOST_ERROR_MESSAGES[type]);
        }
        return;
      }

      const message = validateHost(type, trimmed);
      if (message) {
        throw new Error(message);
      }
    },
  };
}

/** Serial scale port pattern (libs.scale_port.SERIAL_PORT_REGEX). */
const SERIAL_PORT_REGEX =
  /^(COM[1-9][0-9]?|tty[A-Za-z0-9]+|\/dev\/tty[A-Za-z0-9]+)$/;

const COM_INDEX_MIN = 1;
const COM_INDEX_MAX = 99;

/**
 * Returns whether a trimmed string is a legacy COM index (1–99).
 *
 * @param value - Trimmed port input.
 */
function isLegacyComIndex(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  const index = Number(value);
  return Number.isInteger(index) && index >= COM_INDEX_MIN && index <= COM_INDEX_MAX;
}

/**
 * Validates a scale port for serial or TCP connection mode.
 *
 * @param scaleType - ScaleType enum value from the form.
 * @param host - Host field; empty host selects serial mode for MASSA_K_TERM_A.
 * @param value - Raw port input.
 * @returns Error message when invalid; `null` when valid.
 */
export function validateScalePort(
  scaleType: number | undefined,
  host: string | null | undefined,
  value: number | string | null | undefined,
): string | null {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return 'Укажите порт';
  }

  if (isSerialScale(scaleType, host)) {
    if (isLegacyComIndex(trimmed) || SERIAL_PORT_REGEX.test(trimmed)) {
      return null;
    }
    return 'Укажите COM-порт (COM1–COM99), tty… или /dev/tty…';
  }

  return validatePort(trimmed);
}

/**
 * Ant Design Form rule factory for scale port (serial name or TCP 1–65535).
 *
 * @param scaleType - ScaleType enum value from the form.
 * @param host - Host field from the form.
 */
export function scalePortFormRule(
  scaleType: number | undefined,
  host: string | null | undefined,
) {
  return {
    validator: async (_: unknown, value: number | string | null | undefined) => {
      const message = validateScalePort(scaleType, host, value);
      if (message) {
        throw new Error(message);
      }
    },
  };
}

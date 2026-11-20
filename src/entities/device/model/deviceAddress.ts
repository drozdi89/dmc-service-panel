import type { DeviceListItem, DeviceType } from './types';

const COM_INDEX_MIN = 1;
const COM_INDEX_MAX = 99;

/**
 * Formats a serial scale port for list display (legacy index → COM{n}).
 *
 * @param port - Stored port value.
 */
function formatSerialScalePortDisplay(port: string): string {
  const trimmed = port.trim();
  if (/^\d+$/.test(trimmed)) {
    const index = Number(trimmed);
    if (index >= COM_INDEX_MIN && index <= COM_INDEX_MAX) {
      return `COM${index}`;
    }
  }
  return trimmed;
}

/**
 * Formats a device address for list display (Qt DevicesList parity).
 *
 * @param item - Unified device list row.
 * @returns Human-readable address string.
 */
export function formatDeviceAddress(item: DeviceListItem): string {
  const { device_type: type, host, port } = item;

  if (type === 'controller') {
    return port ? String(port) : '—';
  }

  if (type === 'divider') {
    if (port && typeof port === 'string') {
      if (port.includes('.') || port.includes(':')) {
        return port;
      }
      return `COM${port}`;
    }
    if (host && port) {
      return `${host}:${port}`;
    }
    return host ? String(host) : '—';
  }

  if (type === 'scale') {
    const hostStr = (host ?? '').trim();
    const portStr =
      port !== undefined && port !== null && port !== '' ? String(port).trim() : '';

    if (!hostStr) {
      if (portStr) {
        return formatSerialScalePortDisplay(portStr);
      }
      return '—';
    }

    if (portStr) {
      return `${hostStr}:${portStr}`;
    }
    return hostStr;
  }

  if (host && port !== undefined && port !== null && port !== '') {
    return `${host}:${port}`;
  }

  if (host) {
    return String(host);
  }

  if (port !== undefined && port !== null && port !== '') {
    return String(port);
  }

  return '—';
}

/**
 * Builds a stable row key for unified device tables.
 *
 * @param item - Device list row.
 */
export function deviceRowKey(item: DeviceListItem): string {
  return `${item.device_type}-${item.id}`;
}

/**
 * Parses divider combined port (`host:port` or `COMn`) into host/port fields.
 *
 * @param portValue - Combined divider port from API.
 */
export function parseDividerPort(portValue: string): { host: string; port: string } {
  if (portValue.includes(':')) {
    const [host, port] = portValue.split(':', 2);
    return { host: host ?? '', port: port ?? '502' };
  }
  return { host: portValue, port: '502' };
}

/**
 * Combines divider host and port into API `port` field.
 *
 * @param host - Host or COM address.
 * @param port - TCP port.
 */
export function buildDividerPort(host: string, port: string): string {
  const trimmedHost = host.trim();
  const trimmedPort = port.trim();
  if (!trimmedHost) {
    return trimmedPort ? `:${trimmedPort}` : ':502';
  }
  if (trimmedPort) {
    return `${trimmedHost}:${trimmedPort}`;
  }
  return `${trimmedHost}:502`;
}

/**
 * Returns whether connection host/port fields apply to the device type.
 *
 * @param type - Device type.
 */
export function usesConnectionFields(type: DeviceType): boolean {
  return type === 'camera' || type === 'printer' || type === 'scale';
}

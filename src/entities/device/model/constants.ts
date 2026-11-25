import type { DeviceType } from './types';

/** Human-readable labels for device types (Qt DevicesList parity). */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  camera: 'Камера',
  printer: 'Принтер',
  scale: 'Весы',
  controller: 'Контроллер',
  divider: 'Делитель',
};

/** All device types in display order. */
export const ALL_DEVICE_TYPES: DeviceType[] = [
  'camera',
  'printer',
  'scale',
  'controller',
  'divider',
];

/** Device type of a create dialog opened without an explicit type. */
export const DEFAULT_DEVICE_TYPE: DeviceType = 'camera';

/** TypeFilterChips options for the devices list toolbar. */
export const DEVICE_TYPE_CHIP_OPTIONS = ALL_DEVICE_TYPES.map((key) => ({
  key,
  label: DEVICE_TYPE_LABELS[key],
}));

export const DEVICE_TYPE_SELECT_OPTIONS = ALL_DEVICE_TYPES.map((value) => ({
  value,
  label: DEVICE_TYPE_LABELS[value],
}));

/** Default TCP ports per device type (Qt DeviceDetails parity). */
export const DEFAULT_DEVICE_PORTS: Partial<Record<DeviceType, number>> = {
  camera: 23,
  printer: 9100,
  scale: 21053,
  divider: 502,
};

/** Printer model options (PrinterType enum, value >= 0). */
export const PRINTER_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'GODEX' },
  { value: 1, label: 'SAVEMA' },
  { value: 2, label: 'LINX' },
  { value: 3, label: 'DOMINO' },
  { value: 4, label: 'TSPL' },
  { value: 5, label: 'LABELPOINT' },
  { value: 6, label: 'OLDPRINTER' },
  { value: 7, label: 'WINPRINTER' },
  { value: 8, label: 'TSPL Desktop' },
  { value: 9, label: 'GODEX Old Firmware' },
  { value: 10, label: 'LASER' },
  { value: 11, label: 'X1JET' },
  { value: 12, label: 'Rynan R20' },
  { value: 13, label: 'Demi' },
  { value: 14, label: 'FC32' },
  { value: 15, label: 'DMT50' },
  { value: 16, label: 'SmartData X45' },
  { value: 17, label: 'SmartData X40' },
  { value: 18, label: 'NovXLP514' },
  { value: 19, label: 'SAVEMA OLD' },
  { value: 20, label: 'SATO' },
  { value: 21, label: 'Yeacode' },
  { value: 22, label: 'LASER DLC' },
  { value: 23, label: 'Laser 100W' },
  { value: 25, label: 'FC53' },
  { value: 26, label: 'Pokkels Printer' },
  { value: 27, label: 'Laser BSL' },
];

/** Scale model options (ScaleType enum). */
export const SCALE_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Штрих-Slim' },
  { value: 1, label: 'Чеквейр' },
  { value: 2, label: 'Штрих 3–6 кг' },
  { value: 3, label: 'МЕР224АФ152' },
  { value: 4, label: 'АТОЛ Марта' },
  { value: 5, label: 'МАССА-К Терм-А' },
  { value: 6, label: 'Чеквейр (новый)' },
];

/** Controller type options. */
export const CONTROLLER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'DELTA', label: 'DELTA' },
  { value: 'SIEMENS', label: 'SIEMENS' },
  { value: 'XINJE', label: 'XINJE' },
];

/** ScaleType.CHECKWEIR value. */
export const SCALE_TYPE_CHECKWEIR = 1;

/** ScaleType.MASSA_K_TERM_A value. */
export const SCALE_TYPE_MASSA_K_TERM_A = 5;

/** ScaleType.CHECKWEIGHT_NEW value (cbxNewChw in Qt LineConfiguration). */
export const SCALE_TYPE_CHECKWEIGHT_NEW = 6;

/** Scale types that always connect over serial (libs.scale_port.SERIAL_SCALE_TYPES). */
export const SERIAL_SCALE_TYPES: ReadonlySet<number> = new Set([0, 2, 3, 4]);

/** Scale types that always connect over TCP (libs.scale_port.TCP_SCALE_TYPES). */
export const TCP_SCALE_TYPES: ReadonlySet<number> = new Set([1, 6]);

/** Default serial port for new scale devices (Qt parity). */
export const DEFAULT_SERIAL_SCALE_PORT = 'COM1';

/** Default TCP port for checkweigher scales. */
export const DEFAULT_TCP_SCALE_PORT = '21053';

/**
 * Returns whether the scale uses a serial connection (libs.scale_port.is_serial_scale).
 *
 * @param scaleType - ScaleType enum value.
 * @param host - Optional TCP host; empty means serial for MASSA_K_TERM_A.
 */
export function isSerialScale(
  scaleType: number | undefined,
  host: string | null | undefined,
): boolean {
  if (scaleType === undefined) {
    return true;
  }
  if (SERIAL_SCALE_TYPES.has(scaleType)) {
    return true;
  }
  if (scaleType === SCALE_TYPE_MASSA_K_TERM_A) {
    return !(host ?? '').trim();
  }
  return false;
}

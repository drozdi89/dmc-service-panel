import type { components } from '@/shared/api';
import {
  CONTROLLER_TYPE_OPTIONS,
  DEFAULT_DEVICE_PORTS,
  DEFAULT_SERIAL_SCALE_PORT,
  DEFAULT_TCP_SCALE_PORT,
  isSerialScale,
  SCALE_TYPE_CHECKWEIR,
} from './constants';
import type { DeviceType } from './types';

type CameraOutput = components['schemas']['GetCameraSchema'];
type PrinterOutput = components['schemas']['GetPrinterSchema'];
type ScalesOutput = components['schemas']['GetScalesSchema'];
type ControllerOutput = components['schemas']['GetControllerSchema'];
type DividerOutput = components['schemas']['GetDividerSchema'];

type CameraInput = components['schemas']['CameraSchema'];
type PrinterInput = components['schemas']['PrinterSchema'];
type ScalesInput = components['schemas']['ScalesSchema'];
type ControllerInput = components['schemas']['ControllerSchema'];
type DividerInput = components['schemas']['DividerSchema'];

/** Device detail union returned by type-specific GET endpoints. */
export type DeviceDetail =
  | CameraOutput
  | PrinterOutput
  | ScalesOutput
  | ControllerOutput
  | DividerOutput;

/**
 * Form record = API object for the active device type.
 *
 * Field names match the OpenAPI schemas (`type`, `port`, `delay`, …).
 * The device type (endpoint / section) lives in the dialog UI store, not here.
 */
export type DeviceFormValues = {
  id?: number;
  name: string;
  host?: string | null;
  /** Camera/printer: number; scale/controller/divider: string (COM or host:port). */
  port?: number | string | null;
  use_hikrobot_sdk?: boolean;
  brain2_line_name?: string;
  /** Printer / scale / controller model discriminator (`type` in API). */
  type?: number | string;
  dpi?: number;
  buffer?: number;
  preprint_buffer?: number;
  sql_host?: string | null;
  sql_port?: number | null;
  sql_db?: string | null;
  sql_user?: string | null;
  sql_pass?: string | null;
  unit_template_id?: number | null;
  pack_template_id?: number | null;
  slave_id?: number;
  use_queue?: boolean;
  queue_size?: number;
  failed_count?: number;
  pusher_delay?: number;
  pusher_time?: number;
  long_siren_time?: number;
  short_siren_time?: number;
  trigger_filter_delay?: number;
  use_single_sensor?: boolean;
  using_encoder?: boolean;
  tact_to_serve?: number;
  tact_to_read?: number;
  queue_one?: number;
  queue_two?: number;
  rst_print?: number;
  print_job?: number;
  print_delay?: number;
  queue_step?: number;
  coil_step?: number;
  /** Divider delay in milliseconds (API field). */
  delay?: number;
};

const DEFAULT_CONTROLLER_TYPE = CONTROLLER_TYPE_OPTIONS[0]?.value ?? 'DELTA';

const COM_INDEX_MIN = 1;
const COM_INDEX_MAX = 99;

/**
 * Builds ``COM{n}`` from a legacy numeric index (libs.scale_port parity).
 *
 * @param index - Legacy COM port number (1–99).
 */
function comPortFromLegacyIndex(index: number): string {
  if (index < COM_INDEX_MIN || index > COM_INDEX_MAX) {
    throw new Error(
      `Legacy COM port index out of range: ${index} (expected ${COM_INDEX_MIN}–${COM_INDEX_MAX})`,
    );
  }
  return `COM${index}`;
}

/**
 * Normalizes scale port input before API persistence (libs.scale_port.normalize_scale_port_for_save).
 *
 * @param port - Port value from the form.
 * @param scaleType - Selected scale model type.
 * @param host - Host/IP field; empty for serial scales.
 */
export function normalizeScalePortForSave(
  port: string,
  scaleType: number,
  host: string | null | undefined,
): string {
  const normalized = port.trim();
  if (isSerialScale(scaleType, host) && /^\d+$/.test(normalized)) {
    return comPortFromLegacyIndex(Number(normalized));
  }
  return normalized;
}

/**
 * Coerces a numeric device port from form values (camera/printer).
 *
 * @param value - Port field from the form.
 * @param fallback - Default when empty.
 */
function coerceNumericPort(
  value: number | string | null | undefined,
  fallback: number,
): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

/** Options for {@link createDefaultFormValues}. */
export interface CreateDefaultFormValuesOptions {
  /** Pre-selected scale model when creating from a filtered picker. */
  scaleType?: number;
}

/**
 * Returns default form values for a new device of the given type.
 *
 * @param deviceType - Device type to create.
 * @param options - Optional overrides (e.g. scale model from line picker).
 */
export function createDefaultFormValues(
  deviceType: DeviceType,
  options?: CreateDefaultFormValuesOptions,
): DeviceFormValues {
  const base: DeviceFormValues = {
    id: undefined,
    name: '',
    host: '',
    port: DEFAULT_DEVICE_PORTS[deviceType],
  };

  if (deviceType === 'printer') {
    return {
      ...base,
      port: DEFAULT_DEVICE_PORTS.printer ?? 9100,
      type: 0,
      dpi: 300,
      buffer: 0,
      preprint_buffer: 0,
    };
  }

  if (deviceType === 'scale') {
    const scaleType = options?.scaleType ?? 0;
    const port = isSerialScale(scaleType, null)
      ? DEFAULT_SERIAL_SCALE_PORT
      : DEFAULT_TCP_SCALE_PORT;
    return {
      ...base,
      port,
      type: scaleType,
      sql_host: '',
      sql_port: undefined,
      sql_db: '',
      sql_user: '',
      sql_pass: '',
      unit_template_id: null,
      pack_template_id: null,
      brain2_line_name: '',
    };
  }

  if (deviceType === 'controller') {
    return {
      name: '',
      type: DEFAULT_CONTROLLER_TYPE,
      port: '',
      slave_id: 1,
      use_queue: false,
      queue_size: 5,
      failed_count: 3,
      pusher_delay: 1,
      pusher_time: 0,
      long_siren_time: 1,
      short_siren_time: 1,
      trigger_filter_delay: 0,
      use_single_sensor: false,
      using_encoder: false,
      tact_to_serve: 2,
      tact_to_read: 2,
      queue_one: 5,
      queue_two: 5,
      rst_print: 5,
      print_job: 5,
      print_delay: 5,
      queue_step: 5,
      coil_step: 5,
    };
  }

  if (deviceType === 'divider') {
    return {
      name: '',
      port: `:${DEFAULT_DEVICE_PORTS.divider ?? 502}`,
      delay: 0,
    };
  }

  if (deviceType === 'camera') {
    return {
      ...base,
      use_hikrobot_sdk: false,
    };
  }

  return base;
}

/**
 * Puts a type-specific API device record into the form (same field names).
 *
 * @param deviceType - Device type.
 * @param detail - API response from GET by id.
 */
export function selectFormData(
  deviceType: DeviceType,
  detail: DeviceDetail,
): DeviceFormValues {
  if (deviceType === 'camera') {
    const camera = detail as CameraOutput;
    return {
      ...camera,
      host: camera.host ?? '',
    };
  }

  if (deviceType === 'printer') {
    const printer = detail as PrinterOutput;
    return {
      ...printer,
      host: printer.host ?? '',
    };
  }

  if (deviceType === 'scale') {
    const scale = detail as ScalesOutput;
    return {
      ...scale,
      host: scale.host ?? '',
      port: String(scale.port ?? ''),
      sql_host: scale.sql_host ?? '',
      sql_port: scale.sql_port ?? undefined,
      sql_db: scale.sql_db ?? '',
      sql_user: scale.sql_user ?? '',
      sql_pass: scale.sql_pass ?? '',
      unit_template_id: scale.unit_template_id ?? null,
      pack_template_id: scale.pack_template_id ?? null,
    };
  }

  if (deviceType === 'controller') {
    const controller = detail as ControllerOutput;
    return { ...controller };
  }

  const divider = detail as DividerOutput;
  return { ...divider };
}

/**
 * Maps form values to a POST/PATCH request body for the given device type.
 *
 * @param deviceType - Device type (target endpoint).
 * @param values - Validated form values.
 */
export function prepareSave(
  deviceType: DeviceType,
  values: DeviceFormValues,
): CameraInput | PrinterInput | ScalesInput | ControllerInput | DividerInput {
  switch (deviceType) {
    case 'camera':
      return {
        name: values.name.trim(),
        host: values.host?.toString().trim() || null,
        port: coerceNumericPort(values.port, 23),
        use_hikrobot_sdk: values.use_hikrobot_sdk ?? false,
      };
    case 'printer':
      return {
        name: values.name.trim(),
        host: values.host?.toString().trim() || null,
        port: coerceNumericPort(values.port, 9100),
        type: typeof values.type === 'number' ? values.type : 0,
        dpi: values.dpi ?? 300,
        buffer: values.buffer ?? 0,
        preprint_buffer: values.preprint_buffer ?? 0,
      };
    case 'scale': {
      const scaleType = typeof values.type === 'number' ? values.type : 0;
      const host = values.host?.toString().trim() || null;
      const portRaw =
        values.port !== undefined && values.port !== null && String(values.port).trim() !== ''
          ? String(values.port).trim()
          : isSerialScale(scaleType, host)
            ? DEFAULT_SERIAL_SCALE_PORT
            : DEFAULT_TCP_SCALE_PORT;
      return {
        name: values.name.trim(),
        host,
        port: normalizeScalePortForSave(portRaw, scaleType, host),
        type: scaleType,
        sql_host:
          scaleType === SCALE_TYPE_CHECKWEIR
            ? values.sql_host?.toString().trim() || null
            : null,
        sql_port: scaleType === SCALE_TYPE_CHECKWEIR ? values.sql_port ?? null : null,
        sql_db:
          scaleType === SCALE_TYPE_CHECKWEIR
            ? values.sql_db?.toString().trim() || null
            : null,
        sql_user:
          scaleType === SCALE_TYPE_CHECKWEIR
            ? values.sql_user?.toString().trim() || null
            : null,
        sql_pass:
          scaleType === SCALE_TYPE_CHECKWEIR
            ? values.sql_pass?.toString().trim() || null
            : null,
        unit_template_id:
          scaleType === SCALE_TYPE_CHECKWEIR ? values.unit_template_id ?? null : null,
        pack_template_id:
          scaleType === SCALE_TYPE_CHECKWEIR ? values.pack_template_id ?? null : null,
        brain2_line_name: values.brain2_line_name ?? '',
      };
    }
    case 'controller':
      return {
        name: values.name.trim(),
        type: String(values.type ?? DEFAULT_CONTROLLER_TYPE),
        port: String(values.port ?? '').trim(),
        slave_id: values.slave_id ?? 1,
        use_queue: values.use_queue ?? false,
        queue_size: values.queue_size ?? 5,
        failed_count: values.failed_count ?? 3,
        pusher_delay: values.pusher_delay ?? 1,
        pusher_time: values.pusher_time ?? 0,
        long_siren_time: values.long_siren_time ?? 1,
        short_siren_time: values.short_siren_time ?? 1,
        trigger_filter_delay: values.trigger_filter_delay ?? 0,
        use_single_sensor: values.use_single_sensor ?? false,
        using_encoder: values.using_encoder ?? false,
        tact_to_serve: values.tact_to_serve ?? 2,
        tact_to_read: values.tact_to_read ?? 2,
        queue_one: values.queue_one ?? 5,
        queue_two: values.queue_two ?? 5,
        rst_print: values.rst_print ?? 5,
        print_job: values.print_job ?? 5,
        print_delay: values.print_delay ?? 5,
        queue_step: values.queue_step ?? 5,
        coil_step: values.coil_step ?? 5,
      };
    case 'divider':
      return {
        name: values.name.trim(),
        port: String(values.port ?? '').trim(),
        delay: values.delay ?? 0,
      };
    default: {
      const exhaustive: never = deviceType;
      return exhaustive;
    }
  }
}

/**
 * Extracts id and name from a type-specific API response after create/update.
 *
 * @param deviceType - Device type.
 * @param detail - API response body.
 */
export function mapDeviceDetailToRef(
  _deviceType: DeviceType,
  detail: DeviceDetail,
): { id: number; name: string } {
  return { id: (detail as { id: number }).id, name: detail.name };
}

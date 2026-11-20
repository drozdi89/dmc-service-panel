import type { components } from '@/shared/api/types';
import {
  CONTROLLER_TYPE_OPTIONS,
  DEFAULT_DEVICE_PORTS,
  DEFAULT_SERIAL_SCALE_PORT,
  DEFAULT_TCP_SCALE_PORT,
  isSerialScale,
  SCALE_TYPE_CHECKWEIR,
} from './constants';
import { buildDividerPort, parseDividerPort } from './deviceAddress';
import type { DeviceType } from './types';

type CameraOutput = components['schemas']['CameraSchema-Output'];
type PrinterOutput = components['schemas']['PrinterSchema-Output'];
type ScalesOutput = components['schemas']['ScalesSchema-Output'];
type ControllerOutput = components['schemas']['ControllerSchema-Output'];
type DividerOutput = components['schemas']['DividerSchema-Output'];

type CameraInput = components['schemas']['CameraSchema-Input'];
type PrinterInput = components['schemas']['PrinterSchema-Input'];
type ScalesInput = components['schemas']['ScalesSchema-Input'];
type ControllerInput = components['schemas']['ControllerSchema-Input'];
type DividerInput = components['schemas']['DividerSchema-Input'];

/** Device detail union returned by type-specific GET endpoints. */
export type DeviceDetail =
  | CameraOutput
  | PrinterOutput
  | ScalesOutput
  | ControllerOutput
  | DividerOutput;

/**
 * Form values for device create/edit (`DeviceFormModal` / `DeviceFormFields`).
 *
 * Create from a type-locked picker (line field) uses `createDefaultFormValues(type, { scaleType })`
 * together with `lockDeviceType` on the modal so the type cannot change.
 */
export interface DeviceFormValues {
  id?: number;
  device_type: DeviceType;
  name: string;
  host?: string;
  port?: number | string;
  printer_type?: number;
  dpi?: number;
  buffer?: number;
  preprint_buffer?: number;
  scale_type?: number;
  sql_host?: string;
  sql_port?: number;
  sql_db?: string;
  sql_user?: string;
  sql_pass?: string;
  unit_template_id?: number | null;
  pack_template_id?: number | null;
  controller_type?: string;
  controller_port?: string;
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
  divider_host?: string;
  divider_port?: number;
  divider_delay_sec?: number;
}

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
    device_type: deviceType,
    name: '',
    host: '',
    port: DEFAULT_DEVICE_PORTS[deviceType],
  };

  if (deviceType === 'printer') {
    return {
      ...base,
      port: DEFAULT_DEVICE_PORTS.printer ?? 9100,
      printer_type: 0,
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
      scale_type: scaleType,
      sql_host: '',
      sql_port: undefined,
      sql_db: '',
      sql_user: '',
      sql_pass: '',
      unit_template_id: null,
      pack_template_id: null,
    };
  }

  if (deviceType === 'controller') {
    return {
      device_type: deviceType,
      name: '',
      controller_type: DEFAULT_CONTROLLER_TYPE,
      controller_port: '',
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
      device_type: deviceType,
      name: '',
      divider_host: '',
      divider_port: DEFAULT_DEVICE_PORTS.divider ?? 502,
      divider_delay_sec: 0,
    };
  }

  return base;
}

/**
 * Maps a type-specific API device record to form values.
 *
 * @param deviceType - Device type.
 * @param detail - API response from GET by id.
 */
export function mapDeviceDetailToFormValues(
  deviceType: DeviceType,
  detail: DeviceDetail,
): DeviceFormValues {
  if (deviceType === 'camera') {
    const camera = detail as CameraOutput;
    return {
      id: camera.id,
      device_type: deviceType,
      name: camera.name,
      host: camera.host ?? '',
      port: camera.port,
    };
  }

  if (deviceType === 'printer') {
    const printer = detail as PrinterOutput;
    return {
      id: printer.id,
      device_type: deviceType,
      name: printer.name,
      host: printer.host ?? '',
      port: printer.port,
      printer_type: printer.type,
      dpi: printer.dpi,
      buffer: printer.buffer,
      preprint_buffer: printer.preprint_buffer,
    };
  }

  if (deviceType === 'scale') {
    const scale = detail as ScalesOutput;
    return {
      id: scale.id,
      device_type: deviceType,
      name: scale.name,
      host: scale.host ?? '',
      port: String(scale.port ?? ''),
      scale_type: scale.type,
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
    return {
      id: controller.id,
      device_type: deviceType,
      name: controller.name,
      controller_type: controller.type,
      controller_port: controller.port,
      slave_id: controller.slave_id,
      use_queue: controller.use_queue,
      queue_size: controller.queue_size,
      failed_count: controller.failed_count,
      pusher_delay: controller.pusher_delay,
      pusher_time: controller.pusher_time,
      long_siren_time: controller.long_siren_time,
      short_siren_time: controller.short_siren_time,
      trigger_filter_delay: controller.trigger_filter_delay,
      use_single_sensor: controller.use_single_sensor,
      using_encoder: controller.using_encoder,
      tact_to_serve: controller.tact_to_serve,
      tact_to_read: controller.tact_to_read,
      queue_one: controller.queue_one,
      queue_two: controller.queue_two,
      rst_print: controller.rst_print,
      print_job: controller.print_job,
      print_delay: controller.print_delay,
      queue_step: controller.queue_step,
      coil_step: controller.coil_step,
    };
  }

  const divider = detail as DividerOutput;
  const { host, port } = parseDividerPort(divider.port);
  return {
    id: divider.id,
    device_type: deviceType,
    name: divider.name,
    divider_host: host,
    divider_port: Number(port) || 502,
    divider_delay_sec: divider.delay / 1000,
  };
}

/**
 * Maps form values to a POST/PATCH request body for the given device type.
 *
 * @param values - Validated form values.
 */
export function mapFormValuesToPayload(
  values: DeviceFormValues,
): CameraInput | PrinterInput | ScalesInput | ControllerInput | DividerInput {
  switch (values.device_type) {
    case 'camera':
      return {
        id: values.id,
        name: values.name.trim(),
        host: values.host?.trim() || null,
        port: coerceNumericPort(values.port, 23),
      };
    case 'printer':
      return {
        id: values.id,
        name: values.name.trim(),
        host: values.host?.trim() || null,
        port: coerceNumericPort(values.port, 9100),
        type: values.printer_type ?? 0,
        dpi: values.dpi ?? 300,
        buffer: values.buffer ?? 0,
        preprint_buffer: values.preprint_buffer ?? 0,
      };
    case 'scale': {
      const scaleType = values.scale_type ?? 0;
      const host = values.host?.trim() || null;
      const portRaw =
        values.port !== undefined && values.port !== null && String(values.port).trim() !== ''
          ? String(values.port).trim()
          : isSerialScale(scaleType, host)
            ? DEFAULT_SERIAL_SCALE_PORT
            : DEFAULT_TCP_SCALE_PORT;
      return {
        id: values.id,
        name: values.name.trim(),
        host,
        port: normalizeScalePortForSave(portRaw, scaleType, host),
        type: scaleType,
        sql_host:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.sql_host?.trim() || null
            : null,
        sql_port:
          values.scale_type === SCALE_TYPE_CHECKWEIR ? values.sql_port ?? null : null,
        sql_db:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.sql_db?.trim() || null
            : null,
        sql_user:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.sql_user?.trim() || null
            : null,
        sql_pass:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.sql_pass?.trim() || null
            : null,
        unit_template_id:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.unit_template_id ?? null
            : null,
        pack_template_id:
          values.scale_type === SCALE_TYPE_CHECKWEIR
            ? values.pack_template_id ?? null
            : null,
      };
    }
    case 'controller':
      return {
        id: values.id,
        name: values.name.trim(),
        type: values.controller_type ?? DEFAULT_CONTROLLER_TYPE,
        port: values.controller_port?.trim() ?? '',
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
        id: values.id,
        name: values.name.trim(),
        port: buildDividerPort(
          values.divider_host ?? '',
          String(values.divider_port ?? 502),
        ),
        delay: Math.round((values.divider_delay_sec ?? 0) * 1000),
      };
    default: {
      const exhaustive: never = values.device_type;
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

import type { CreatePrintStationPayload, PrintStation, UpdatePrintStationPayload } from './types';

/** Default values for a new print station form. */
export const DEFAULT_PRINT_STATION_FORM_VALUES: PrintStationFormValues = {
  name: '',
  printer_id: null,
  camera_id: null,
  template_id: null,
  max_failures: 5,
  grade_percent: 0,
};

/** Form values for print station create/edit modal. */
export interface PrintStationFormValues {
  name: string;
  printer_id: number | null;
  camera_id: number | null;
  template_id: number | null;
  max_failures: number;
  grade_percent: number;
}

/** Optional display labels for linked resources in ResourcePicker. */
export interface PrintStationResourceLabels {
  printerName?: string;
  cameraName?: string;
  templateName?: string;
}

/**
 * Maps API resource id to nullable form value (0 means "not used").
 *
 * @param id - Printer or camera id from API.
 */
export function mapApiDeviceIdToForm(id: number | null | undefined): number | null {
  if (id === null || id === undefined || id === 0) {
    return null;
  }
  return id;
}

/**
 * Maps nullable form device id to API payload (null → 0).
 *
 * @param id - Selected device id in the form.
 */
export function mapFormDeviceIdToApi(id: number | null | undefined): number {
  return id ?? 0;
}

/**
 * Formats linked resource id for table display.
 * When `nameById` has a label, shows the name; otherwise falls back to `#id`.
 *
 * @param id - Linked entity id from list row.
 * @param nameById - Optional id → name map (devices / templates lookup).
 */
export function formatLinkedResourceId(
  id: number | null | undefined,
  nameById?: ReadonlyMap<number, string>,
): string {
  if (id === null || id === undefined || id === 0) {
    return 'Не используется';
  }
  const name = nameById?.get(id);
  if (name != null && name !== '') {
    return name;
  }
  return `#${id}`;
}

/**
 * Builds an id → name map from lookup list items.
 *
 * @param items - Lookup rows with numeric `id` and `name`.
 */
export function buildLinkedResourceNameMap(
  items: ReadonlyArray<{ id: number; name: string }> | undefined,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const item of items ?? []) {
    map.set(item.id, item.name);
  }
  return map;
}

/**
 * Maps print station API record to form values.
 *
 * @param station - Station detail from GET.
 */
export function mapPrintStationToFormValues(station: PrintStation): PrintStationFormValues {
  return {
    name: station.name,
    printer_id: mapApiDeviceIdToForm(station.printer),
    camera_id: mapApiDeviceIdToForm(station.camera),
    template_id: station.template_id ?? null,
    max_failures: station.max_failures,
    grade_percent: station.grade_percent,
  };
}

/**
 * Maps form values to POST payload.
 *
 * @param values - Validated form values.
 */
export function mapFormValuesToCreatePayload(
  values: PrintStationFormValues,
): CreatePrintStationPayload {
  return {
    name: values.name.trim(),
    printer: mapFormDeviceIdToApi(values.printer_id),
    camera: mapFormDeviceIdToApi(values.camera_id),
    template_id: values.template_id,
    max_failures: values.max_failures,
    grade_percent: values.grade_percent,
  };
}

/**
 * Maps form values to PATCH payload.
 *
 * @param values - Validated form values.
 */
export function mapFormValuesToUpdatePayload(
  values: PrintStationFormValues,
): UpdatePrintStationPayload {
  return mapFormValuesToCreatePayload(values);
}

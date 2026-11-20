import type { CreatePrintStationPayload, PrintStation, UpdatePrintStationPayload } from './types';

/**
 * Default values for a new print station form (create schema).
 * In the form `printer` / `camera` hold `null` for «not used»; the API stores `0`.
 */
export const DEFAULT_PRINT_STATION_FORM_VALUES: CreatePrintStationPayload = {
  name: '',
  printer: null,
  camera: null,
  template_id: null,
  max_failures: 5,
  grade_percent: 0,
  skip_initial_noread: 0,
};

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
 * Puts the GET record into the form: same fields, unused devices as `null`.
 *
 * @param station - Station detail from GET.
 */
export function mapPrintStationToFormValues(station: PrintStation): CreatePrintStationPayload {
  return {
    ...station,
    printer: mapApiDeviceIdToForm(station.printer),
    camera: mapApiDeviceIdToForm(station.camera),
    template_id: station.template_id ?? null,
  };
}

/**
 * Builds POST body from the form object.
 *
 * @param values - Validated form values.
 */
export function mapFormValuesToCreatePayload(
  values: CreatePrintStationPayload,
): CreatePrintStationPayload {
  return {
    name: values.name.trim(),
    printer: mapFormDeviceIdToApi(values.printer),
    camera: mapFormDeviceIdToApi(values.camera),
    template_id: values.template_id ?? null,
    max_failures: values.max_failures,
    grade_percent: values.grade_percent,
    skip_initial_noread: values.skip_initial_noread ?? 0,
  };
}

/**
 * Builds PATCH body from the form object (`skip_initial_noread` is not edited here).
 *
 * @param values - Validated form values.
 */
export function mapFormValuesToUpdatePayload(
  values: CreatePrintStationPayload,
): UpdatePrintStationPayload {
  return {
    name: values.name.trim(),
    printer: mapFormDeviceIdToApi(values.printer),
    camera: mapFormDeviceIdToApi(values.camera),
    template_id: values.template_id ?? null,
    max_failures: values.max_failures,
    grade_percent: values.grade_percent,
  };
}

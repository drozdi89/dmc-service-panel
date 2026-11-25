import { LINE_PRINTED_DM_OPTION, LINE_TYPE } from './constants';
import type {
  AggregationLevelConfiguration,
  AggregationLevelFormState,
  AggregationLevelLabels,
  AutomatedLineSubtype,
  LineConfiguration,
  LineEditorFormState,
  LineEditorResourceLabels,
  LineEditorVisibility,
  LineKind,
  LineOptionsFormState,
  LineOutputMode,
  LineWritePayload,
  ScaleWorkplaceConfiguration,
  ScaleWorkplaceFormState,
  ScaleWorkplaceLabels,
} from './types';

const DEFAULT_OPTIONS: LineOptionsFormState = {
  must_scan_before_start: false,
  cam_disable: false,
  cam_hide: false,
  ask_befor_task: false,
  control_task_date: false,
  reserve_disabled: false,
  validate_ean: false,
  can_add_task: false,
};

const EMPTY_WORKPLACE: ScaleWorkplaceFormState = {
  scale_id: null,
  printer_id: null,
  template_id: null,
};

/**
 * Default resource labels for a new line editor (no loaded configuration).
 */
export function createDefaultLineEditorLabels(): LineEditorResourceLabels {
  return {
    scale_stations: {
      first: {},
      second: {},
    },
    aggregation_levels: [],
  };
}

/**
 * Default form state for a new line.
 */
export function createDefaultLineFormState(): LineEditorFormState {
  return {
    id: undefined,
    slaveid: null,
    linename: '',
    one_s_line_code: '',
    is_manual: false,
    is_scale: false,
    output: 0,
    line_type: LINE_TYPE.DEFAULT,
    external_line: false,
    group_scan: false,
    allow_printed_dm: false,
    camera_id: null,
    printed_camera_id: null,
    printer_id: null,
    printer_id_s: null,
    template_id: null,
    plain_template_id: null,
    scale_id: null,
    controller_id: null,
    options: { ...DEFAULT_OPTIONS },
    scale_stations: {
      first: { ...EMPTY_WORKPLACE },
      second: { ...EMPTY_WORKPLACE },
    },
    aggregation_levels: [],
    favourite_gtins: [],
  };
}

/**
 * Maps nullable device id from API nested object.
 */
function mapDeviceId(device?: { id?: number | null } | null): number | null {
  const id = device?.id;
  return id === null || id === undefined || id === 0 ? null : id;
}

/**
 * Maps scale workplace from API to form state.
 */
function mapWorkplace(
  workplace?: ScaleWorkplaceConfiguration | null,
): ScaleWorkplaceFormState {
  return {
    scale_id: mapDeviceId(workplace?.scale),
    printer_id: mapDeviceId(workplace?.printer),
    template_id: mapDeviceId(workplace?.template),
  };
}

function mapWorkplaceToLabels(
  workplace?: ScaleWorkplaceConfiguration | null,
): ScaleWorkplaceLabels {
  return {
    scaleLabel: workplace?.scale?.name,
    printerLabel: workplace?.printer?.name,
    templateLabel: workplace?.template?.name,
  };
}

/**
 * Line kind radio value from `is_manual` (Qt frmLineType).
 *
 * @param state - Form fields with `is_manual`.
 */
export function resolveLineKind(state: Pick<LineWritePayload, 'is_manual'>): LineKind {
  return state.is_manual ? 'manual' : 'automated';
}

/**
 * Automated subtype radio value from `line_type`.
 *
 * @param lineType - API `line_type`.
 */
export function resolveAutomatedSubtype(lineType?: string | null): AutomatedLineSubtype {
  return lineType === LINE_TYPE.DOYPACK ? 'doypack' : 'default';
}

/**
 * Whether `line_type` marks a print-only line without verification.
 *
 * @param lineType - API `line_type`.
 */
export function isPrintOnlyNoVerify(lineType?: string | null): boolean {
  return lineType === LINE_TYPE.PRINT_NO_VERIFY;
}

/**
 * Serialization output mode from `output` / `is_scale` (Qt print_options).
 *
 * @param state - Form fields with `output` and `is_scale`.
 */
export function resolveOutputMode(
  state: Pick<LineWritePayload, 'output' | 'is_scale'>,
): LineOutputMode {
  if (state.output === 0) {
    return 'printer';
  }
  return state.is_scale ? 'scale' : 'checkweir';
}

/**
 * API `output` / `is_scale` for an output mode radio value.
 *
 * @param mode - Selected output mode.
 */
export function outputModeToFields(
  mode: LineOutputMode,
): Pick<LineWritePayload, 'output' | 'is_scale'> {
  if (mode === 'printer') {
    return { output: 0, is_scale: false };
  }
  return { output: 1, is_scale: mode === 'scale' };
}

/**
 * Computes visibility and disable flags from editor state
 * (паритет Qt `LineConfiguration` / `gbSerialization` / `tabWidget`).
 *
 * Qt mapping:
 * - `external_line` / print-only `line_type` → `_switch_ui_for_no_options` (extended tabs)
 * - `is_manual` → `gbSerialization` pages automated / manual
 * - `output` / `is_scale` → print branch inside automated page
 * - `loadedIsManual` → `tabFavProducts.setEnabled(False)` at load
 * - `!isNewLine` → `frmLineType.setEnabled(False)`
 *
 * Consumers should only read {@link LineEditorVisibility} flags — do not re-derive
 * the same conditions in UI components.
 *
 * @param state - Current line editor form state.
 * @param isNewLine - Whether the editor is creating a new line (kind toggle enabled).
 * @param loadedIsManual - `is_manual` of the loaded configuration (existing line).
 */
export function computeLineEditorVisibility(
  state: LineEditorFormState,
  isNewLine: boolean,
  loadedIsManual = false,
): LineEditorVisibility {
  const hideExtendedTabs =
    Boolean(state.external_line) || isPrintOnlyNoVerify(state.line_type);

  const isManual = resolveLineKind(state) === 'manual';
  const isAutomated = !isManual;

  const outputMode = resolveOutputMode(state);
  const isScale = outputMode === 'scale';
  const isPrinter = outputMode === 'printer';
  const isCheckweir = outputMode === 'checkweir';

  const isDoypack = resolveAutomatedSubtype(state.line_type) === 'doypack';

  return {
    showExtendedTabs: !hideExtendedTabs,
    showLineKind: !hideExtendedTabs,
    disableLineKindToggle: !isNewLine,
    showLineOptions: !hideExtendedTabs,
    disableCanAddTask: isManual,

    showManualLineNotice: isManual,
    showAutomatedSerialization: isAutomated,
    showSerializationSubtype: isAutomated && !isScale,
    showPrinterSerialization: isAutomated && isPrinter,
    showCheckweirPicker: isAutomated && isCheckweir,
    showScaleWorkplacesPanel: isAutomated && isScale,

    /** Qt: hide Aggregation + Products (and Main) via `tabWidget.setHidden`. */
    hideExtendedTabs: hideExtendedTabs,
    disableProductsTab: loadedIsManual,
    showGroupScan: !isDoypack,
    useDoypackCameraLabels: isDoypack,
    disableAutoAggregationAdd: isManual,
  };
}

/**
 * Maps aggregation level from API to editor state.
 */
export function mapAggregationLevelToForm(
  level: AggregationLevelConfiguration,
): AggregationLevelFormState {
  const unit_camera_ids = (level.unit_cameras ?? [])
    .map((camera) => camera.id)
    .filter((id): id is number => id !== null && id !== undefined);

  const printer_ids = (level.printers ?? [])
    .map((printer) => printer.id)
    .filter((id): id is number => id !== null && id !== undefined);

  return {
    id: level.id ?? undefined,
    name: level.name,
    level: level.level,
    is_manual: level.is_manual,
    use_count_method: level.use_count_method,
    template_id: mapDeviceId(level.template),
    plain_template_id: mapDeviceId(level.plain_template),
    camera_id: mapDeviceId(level.aggregate_camera),
    print_camera_id: mapDeviceId(level.aggregate_print_camera),
    controller_id: mapDeviceId(level.controller),
    divider_id: mapDeviceId(level.divider),
    generator_type: level.generator_type ?? 0,
    two_cam_mode: level.two_cam_mode,
    aggr_timeout_ms: level.aggr_timeout_ms,
    print_on_error: level.print_empty_label_on_error ?? false,
    unit_camera_ids,
    printer_ids,
    aggregation_type: level.aggregation_type ?? (level.is_manual ? 'manual' : 'automated'),
  };
}

/**
 * Maps aggregation level device labels for UI state.
 */
export function mapAggregationLevelToLabels(
  level: AggregationLevelConfiguration,
): AggregationLevelLabels {
  const unitCameraLabels: Record<number, string> = {};
  for (const camera of level.unit_cameras ?? []) {
    const id = camera.id;
    if (id !== null && id !== undefined) {
      unitCameraLabels[id] = camera.name ?? `#${id}`;
    }
  }

  const printerLabels: Record<number, string> = {};
  for (const printer of level.printers ?? []) {
    const id = printer.id;
    if (id !== null && id !== undefined) {
      printerLabels[id] = printer.name ?? `#${id}`;
    }
  }

  return {
    templateLabel: level.template?.name,
    plainTemplateLabel: level.plain_template?.name,
    cameraLabel: level.aggregate_camera?.name,
    printCameraLabel: level.aggregate_print_camera?.name,
    controllerLabel: level.controller?.name,
    dividerLabel: level.divider?.name,
    unitCameraLabels,
    printerLabels,
  };
}

/**
 * Maps full line configuration (GET get_line) to the `/lines/` write fields
 * plus nested slices edited by the same dialog.
 *
 * @param config - Line configuration from GET get_line.
 * @param allowPrintedDm - Parsed line_printed_dm_use flag.
 */
export function mapLineConfigurationToForm(
  config: LineConfiguration,
  allowPrintedDm = false,
): LineEditorFormState {
  return {
    id: config.id ?? undefined,
    slaveid: config.slaveid ?? null,
    linename: config.name,
    one_s_line_code: config.one_s_code ?? '',
    is_manual: config.is_manual,
    is_scale: config.output === 0 ? false : config.is_scale,
    output: config.output,
    line_type: config.line_type ?? LINE_TYPE.DEFAULT,
    external_line: config.external_line,
    group_scan: config.group_scan,
    allow_printed_dm: allowPrintedDm,
    camera_id: mapDeviceId(config.camera),
    printed_camera_id: mapDeviceId(config.printed_codes_camera),
    printer_id: mapDeviceId(config.printer),
    printer_id_s: mapDeviceId(config.printer_2),
    template_id: mapDeviceId(config.template),
    plain_template_id: mapDeviceId(config.plain_template),
    scale_id: mapDeviceId(config.scale),
    controller_id: mapDeviceId(config.controller),
    options: {
      must_scan_before_start: config.options?.must_scan_before_start ?? false,
      cam_disable: config.options?.cam_disable ?? false,
      cam_hide: config.options?.cam_hide ?? false,
      ask_befor_task: config.options?.ask_befor_task ?? false,
      control_task_date: config.options?.control_task_date ?? false,
      reserve_disabled: config.options?.reserve_disabled ?? false,
      validate_ean: config.options?.validate_ean ?? false,
      can_add_task: config.options?.can_add_task ?? false,
    },
    scale_stations: {
      first: mapWorkplace(config.scale_stations?.first),
      second: mapWorkplace(config.scale_stations?.second),
    },
    aggregation_levels: (config.aggregation_levels ?? []).map(mapAggregationLevelToForm),
    favourite_gtins: (config.wares ?? [])
      .map((ware) => ware.gtin)
      .filter((gtin): gtin is string => typeof gtin === 'string' && gtin.length > 0),
  };
}

/**
 * Maps line configuration resource labels for UI state (parallel to form mapping).
 */
export function mapLineConfigurationToLabels(
  config: LineConfiguration,
): LineEditorResourceLabels {
  return {
    cameraLabel: config.camera?.name,
    printedCameraLabel: config.printed_codes_camera?.name,
    printerLabel: config.printer?.name,
    printer2Label: config.printer_2?.name,
    templateLabel: config.template?.name,
    plainTemplateLabel: config.plain_template?.name,
    scaleLabel: config.scale?.name,
    controllerLabel: config.controller?.name,
    scale_stations: {
      first: mapWorkplaceToLabels(config.scale_stations?.first),
      second: mapWorkplaceToLabels(config.scale_stations?.second),
    },
    aggregation_levels: (config.aggregation_levels ?? []).map(mapAggregationLevelToLabels),
  };
}

/**
 * Reindexes aggregation level numbers after reorder.
 */
export function reindexAggregationLevels(
  levels: AggregationLevelFormState[],
): AggregationLevelFormState[] {
  return levels.map((level, index) => ({ ...level, level: index }));
}

/**
 * Whether automated aggregation can be added after current levels.
 */
export function canAddAutomatedAggregationLevel(
  levels: AggregationLevelFormState[],
): boolean {
  if (levels.length === 0) {
    return true;
  }
  return !levels[levels.length - 1]?.is_manual;
}

/**
 * Validates manual aggregation level printer/template pairing (Qt parity).
 * Both must be set or both omitted.
 */
export function validateManualAggregationLevel(
  level: Pick<AggregationLevelFormState, 'printer_ids' | 'template_id'>,
): string | null {
  const hasPrinter = (level.printer_ids?.length ?? 0) > 0;
  const hasTemplate = level.template_id !== null;
  if (hasTemplate && !hasPrinter) {
    return 'Вы указали шаблон печати, но не задали принтер. Укажите принтер для печати.';
  }
  if (hasPrinter && !hasTemplate) {
    return 'Вы указали принтер, но не задали шаблон. Укажите шаблон для печати.';
  }
  return null;
}

/**
 * Whether two aggregation levels can be swapped (manual levels are fixed).
 */
export function canSwapAggregationLevels(
  levels: AggregationLevelFormState[],
  fromIndex: number,
  toIndex: number,
): boolean {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= levels.length || toIndex >= levels.length) {
    return false;
  }
  return !levels[fromIndex]?.is_manual && !levels[toIndex]?.is_manual;
}

/**
 * Validates line form before save; returns user-facing error or null.
 */
export function validateLineForm(state: LineEditorFormState): string | null {
  if (!state.linename?.trim()) {
    return 'Укажите название производственной линии';
  }
  const isAutomatedSerialization =
    !state.is_manual && !isPrintOnlyNoVerify(state.line_type);
  if (
    isAutomatedSerialization &&
    resolveOutputMode(state) === 'printer' &&
    state.printer_id != null &&
    state.printer_id_s != null &&
    state.printer_id === state.printer_id_s
  ) {
    return 'Второй принтер не может совпадать с принтером сериализации';
  }
  for (const level of state.aggregation_levels) {
    if (!level.name.trim()) {
      return 'Укажите наименование уровня агрегации';
    }
    if (level.is_manual) {
      const pairingError = validateManualAggregationLevel(level);
      if (pairingError) {
        const levelLabel = level.name.trim() || 'Ручной уровень агрегации';
        return `${levelLabel}: ${pairingError}`;
      }
    }
  }
  return null;
}

/**
 * Normalizes `line_type` for API: doypack applies only to automated lines.
 */
export function buildLineType(state: LineEditorFormState): string {
  if (isPrintOnlyNoVerify(state.line_type)) {
    return LINE_TYPE.PRINT_NO_VERIFY;
  }
  if (!state.is_manual && state.line_type === LINE_TYPE.DOYPACK) {
    return LINE_TYPE.DOYPACK;
  }
  return LINE_TYPE.DEFAULT;
}

/**
 * Builds POST/PATCH body for /lines/ from editor state
 * (clears devices that do not apply to the selected kind / output mode).
 */
export function buildLinePayload(state: LineEditorFormState): LineWritePayload {
  const isManual = state.is_manual || isPrintOnlyNoVerify(state.line_type);
  const outputMode = resolveOutputMode(state);
  const isScale = outputMode === 'scale';
  const noSerialization = isManual || isScale;
  const noPrinter = noSerialization || outputMode !== 'printer';

  return {
    linename: state.linename.trim(),
    is_manual: isManual,
    is_scale: isScale,
    camera_id: noSerialization ? null : (state.camera_id ?? null),
    printed_camera_id: noSerialization ? null : (state.printed_camera_id ?? null),
    printer_id: noPrinter ? null : (state.printer_id ?? null),
    printer_id_s: noPrinter ? null : (state.printer_id_s ?? null),
    template_id: noPrinter ? null : (state.template_id ?? null),
    plain_template_id: noPrinter ? null : (state.plain_template_id ?? null),
    scale_id: noSerialization ? null : (state.scale_id ?? null),
    output: outputMode === 'printer' ? 0 : 1,
    controller_id: noSerialization ? null : (state.controller_id ?? null),
    one_s_line_code: state.one_s_line_code?.trim() || null,
    group_scan: noSerialization ? false : Boolean(state.group_scan),
    external_line: Boolean(state.external_line),
    line_type: buildLineType(state),
  };
}

/**
 * Builds lines_options payload.
 */
export function buildLinesOptionsPayload(state: LineEditorFormState, lineId: number) {
  return {
    lineid: lineId,
    ...state.options,
  };
}

/**
 * Builds weight stations payload for scale lines.
 */
export function buildWeightStationsPayload(state: LineEditorFormState, lineId: number) {
  return {
    lineid: lineId,
    first_scale_id: state.scale_stations.first.scale_id,
    first_printer_id: state.scale_stations.first.printer_id,
    first_template_id: state.scale_stations.first.template_id,
    second_scale_id: state.scale_stations.second.scale_id,
    second_printer_id: state.scale_stations.second.printer_id,
    second_template_id: state.scale_stations.second.template_id,
  };
}

/**
 * Builds aggregation level POST/PATCH body.
 */
export function buildAggregationLevelPayload(
  level: AggregationLevelFormState,
  lineId: number,
) {
  return {
    name: level.name.trim(),
    level: level.level,
    line_id: lineId,
    use_count_method: level.use_count_method,
    template_id: level.template_id,
    plain_template_id: level.plain_template_id,
    camera_id: level.camera_id,
    print_camera_id: level.print_camera_id,
    controller_id: level.controller_id,
    divider_id: level.divider_id,
    is_manual: level.is_manual,
    generator_type: level.generator_type ?? 0,
    two_cam_mode: level.two_cam_mode,
    aggr_timeout_ms: level.aggr_timeout_ms,
    print_on_error: level.print_on_error,
    feed_label_on_start: false,
    allways_print_logic: false,
  };
}

/**
 * Updates line_printed_dm_use JSON map for a line.
 */
export function buildLinePrintedDmSettings(
  lineId: number,
  enabled: boolean,
  rawValue: string | null,
): Array<{ name: string; value: string }> {
  const map = rawValue ? (JSON.parse(rawValue) as Record<string, boolean>) : {};
  map[String(lineId)] = enabled;
  return [{ name: LINE_PRINTED_DM_OPTION, value: JSON.stringify(map) }];
}

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
    loaded_is_manual: false,
    name: '',
    one_s_code: '',
    is_scale: false,
    output: 0,
    lineKind: 'automated',
    automatedSubtype: 'default',
    outputMode: 'printer',
    external_line: false,
    print_only_no_verify: false,
    group_scan: false,
    allow_printed_dm: false,
    camera_id: null,
    printed_codes_camera_id: null,
    printer_id: null,
    printer_2_id: null,
    template_id: null,
    plain_template_id: null,
    scale_id: null,
    new_chw_scale_id: null,
    controller_id: null,
    options: { ...DEFAULT_OPTIONS },
    scale_stations: {
      first: { ...EMPTY_WORKPLACE },
      second: { ...EMPTY_WORKPLACE },
    },
    aggregation_levels: [],
    deleted_aggregation_level_ids: [],
    favourite_gtins: [],
    has_lines_options: false,
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
 * Computes visibility and disable flags from editor state
 * (паритет Qt `LineConfiguration` / `gbSerialization` / `tabWidget`).
 *
 * Qt mapping:
 * - `external_line` / `print_only_no_verify` → `_switch_ui_for_no_options` (extended tabs)
 * - `lineKind` automated / manual / scale → `gbSerialization` pages 0 / 1 / 2
 * - `outputMode` printer / checkweir → print branch inside automated page
 * - `loaded_is_manual` → `tabFavProducts.setEnabled(False)` at load
 * - `!isNewLine` → `frmLineType.setEnabled(False)`
 *
 * Consumers should only read {@link LineEditorVisibility} flags — do not re-derive
 * the same conditions in UI components.
 *
 * @param state - Current line editor form state.
 * @param isNewLine - Whether the editor is creating a new line (kind toggle enabled).
 */
export function computeLineEditorVisibility(
  state: LineEditorFormState,
  isNewLine: boolean,
): LineEditorVisibility {
  const hideExtendedTabs = state.external_line || state.print_only_no_verify;

  const isManual = state.lineKind === 'manual';
  const isAutomated = state.lineKind === 'automated';
  
  const isScale = state.outputMode === 'scale';
  const isPrinter = state.outputMode === 'printer';
  const isCheckweir = state.outputMode === 'checkweir';

  const isDoypack = state.automatedSubtype === 'doypack';

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
    disableProductsTab: state.loaded_is_manual,
    showGroupScan: !isDoypack,
    useDoypackCameraLabels: isDoypack,
    disableAutoAggregationAdd: isManual,
  };
}

/**
 * Resolves line kind from configuration flags.
 */
export function resolveLineKind(config: LineConfiguration): LineKind {
  if (config.is_manual) {
    return 'manual';
  }
  return 'automated';
}

/**
 * Resolves automated subtype from line_type.
 */
export function resolveAutomatedSubtype(lineType?: string | null): AutomatedLineSubtype {
  return lineType === LINE_TYPE.DOYPACK ? 'doypack' : 'default';
}

/**
 * Resolves output mode from output field.
 */
export function resolveOutputMode(output: number): LineOutputMode {
  return output === 1 ? 'checkweir' : 'printer';
}

/**
 * Migrates scale id/label when toggling printer ↔ checkweir (Qt uses single scale field).
 *
 * @param state - Current editor state.
 * @param newOutputMode - Selected output mode.
 */
export function applyOutputModeChange(
  state: LineEditorFormState,
  newOutputMode: LineOutputMode,
): Partial<LineEditorFormState> {
  if (state.outputMode === newOutputMode) {
    return { outputMode: newOutputMode };
  }

  if (newOutputMode === 'checkweir') {
    return {
      outputMode: newOutputMode,
      scale_id: state.new_chw_scale_id,
      new_chw_scale_id: null,
    };
  }

  return {
    outputMode: newOutputMode,
    new_chw_scale_id: state.scale_id,
    scale_id: null,
  };
}

/**
 * Migrates scale display labels when toggling printer ↔ checkweir.
 */
export function applyOutputModeLabelsChange(
  labels: LineEditorResourceLabels,
  fromMode: LineOutputMode,
  toMode: LineOutputMode,
): Partial<LineEditorResourceLabels> {
  if (fromMode === toMode) {
    return {};
  }

  if (toMode === 'checkweir') {
    return {
      scaleLabel: labels.newChwScaleLabel,
      newChwScaleLabel: undefined,
    };
  }

  if (fromMode === 'checkweir' && toMode === 'printer') {
    return {
      newChwScaleLabel: labels.scaleLabel,
      scaleLabel: undefined,
    };
  }

  return {};
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
 * Maps full line configuration and allow-printed flag to editor form state.
 *
 * @param config - Line configuration from GET get_line.
 * @param allowPrintedDm - Parsed line_printed_dm_use flag.
 */
export function mapLineConfigurationToForm(
  config: LineConfiguration,
  allowPrintedDm = false,
): LineEditorFormState {
  const outputMode = config.output === 0 ? 'printer' : config.is_scale ? 'scale' : 'checkweir';
  const is_scale = config.output === 0 ? false : config.is_scale;

  const mappedScaleId = mapDeviceId(config.scale);
          
  
  return {
    print_only_no_verify: config.line_type === LINE_TYPE.PRINT_NO_VERIFY,
    lineKind: resolveLineKind(config),

    outputMode,
    output: config.output,


    id: config.id ?? undefined,
    slaveid: config.slaveid ?? null,
    loaded_is_manual: config.is_manual,
    name: config.name,
    one_s_code: config.one_s_code ?? '',
    
    automatedSubtype: resolveAutomatedSubtype(config.line_type),
    is_scale,
    external_line: config.external_line,
    
    group_scan: config.group_scan,
    allow_printed_dm: allowPrintedDm,
    camera_id: mapDeviceId(config.camera),
    printed_codes_camera_id: mapDeviceId(config.printed_codes_camera),
    printer_id: mapDeviceId(config.printer),
    printer_2_id: mapDeviceId(config.printer_2),
    template_id: mapDeviceId(config.template),
    plain_template_id: mapDeviceId(config.plain_template),
    scale_id: outputMode === 'checkweir' ? mappedScaleId : null,
    new_chw_scale_id: outputMode === 'printer' ? mappedScaleId : null,
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
    deleted_aggregation_level_ids: [],
    favourite_gtins: (config.wares ?? [])
      .map((ware) => ware.gtin)
      .filter((gtin): gtin is string => Boolean(gtin)),
    has_lines_options: Boolean(config.options),
  };
}

/**
 * Maps line configuration resource labels for UI state (parallel to form mapping).
 */
export function mapLineConfigurationToLabels(
  config: LineConfiguration,
): LineEditorResourceLabels {
  const outputMode =
    config.output === 0 ? 'printer' : config.is_scale ? 'scale' : 'checkweir';

  return {
    cameraLabel: config.camera?.name,
    printedCodesCameraLabel: config.printed_codes_camera?.name,
    printerLabel: config.printer?.name,
    printer2Label: config.printer_2?.name,
    templateLabel: config.template?.name,
    plainTemplateLabel: config.plain_template?.name,
    scaleLabel: outputMode === 'checkweir' ? config.scale?.name : undefined,
    newChwScaleLabel: outputMode === 'printer' ? config.scale?.name : undefined,
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
  if (!state.name.trim()) {
    return 'Укажите название производственной линии';
  }
  const isAutomatedSerialization =
    state.lineKind === 'automated' && !state.print_only_no_verify;
  if (
    isAutomatedSerialization &&
    state.outputMode === 'printer' &&
    state.printer_id !== null &&
    state.printer_2_id !== null &&
    state.printer_id === state.printer_2_id
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
 * Builds line_type string for API from form state.
 */
export function buildLineType(state: LineEditorFormState): string {
  if (state.print_only_no_verify) {
    return LINE_TYPE.PRINT_NO_VERIFY;
  }
  if (state.lineKind === 'automated' && state.automatedSubtype === 'doypack') {
    return LINE_TYPE.DOYPACK;
  }
  return LINE_TYPE.DEFAULT;
}

/**
 * Builds POST/PATCH body for /lines/ from editor state.
 */
export function buildLinePayload(state: LineEditorFormState) {
  const isManual = state.lineKind === 'manual' || state.print_only_no_verify;
  const isScale = state.outputMode === 'scale';

  return {
    linename: state.name.trim(),
    is_manual: isManual,
    is_scale: isScale,
    camera_id: isManual || isScale ? null : state.camera_id,
    printed_camera_id: isManual || isScale ? null : state.printed_codes_camera_id,
    printer_id:
      isManual || isScale || state.outputMode !== 'printer' ? null : state.printer_id,
    printer_id_s:
      isManual || isScale || state.outputMode !== 'printer' ? null : state.printer_2_id,
    template_id:
      isManual || isScale || state.outputMode !== 'printer' ? null : state.template_id,
    plain_template_id:
      isManual || isScale || state.outputMode !== 'printer' ? null : state.plain_template_id,
    scale_id:
      isManual || isScale
        ? null
        : state.outputMode === 'checkweir'
          ? state.scale_id
          : state.new_chw_scale_id,
    output: state.outputMode === 'printer' ? 0 : 1, 
    controller_id: isManual || isScale ? null : state.controller_id,
    one_s_line_code: state.one_s_code.trim() || null,
    group_scan: isManual || isScale ? false : state.group_scan,
    external_line: state.external_line,
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

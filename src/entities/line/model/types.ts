import type { components } from '@/shared/api';

/** Brief line row from GET /lines/. */
export type LineListItem = components['schemas']['GetLinesSchema'];

export type AggregationType = components['schemas']['AggregationLevelType'];

/** Full line configuration from GET /lines/get_line/{id}. */
export type LineConfiguration = components['schemas']['GetLineConfigurationSchema'];

/** Aggregation level in full line configuration. */
export type AggregationLevelConfiguration = components['schemas']['LineAggregationLevelSchema'];

/** Scale workplace settings in line configuration. */
export type ScaleWorkplaceConfiguration = components['schemas']['ScaleWorkplaceSettingsSchema'];

/** First/second scale workplaces. */
export type ScaleWorkplacesConfiguration = components['schemas']['ScaleWorkplacesSchema'];

/** Line runtime options from configuration. */
export type LineOptionsConfiguration = components['schemas']['LinesOptionsSchema'];

/** Line category in the editor (Qt radio buttons). */
export type LineKind = 'automated' | 'manual' | 'scale';

/** Automated line subtype. */
export type AutomatedLineSubtype = 'default' | 'doypack';

/** Serialization output device mode. */
/** Printer vs checkweir branch inside automated serialization (Qt print_options). */
export type LineOutputMode = 'printer' | 'checkweir' | 'scale';

/** Resource label cache for ResourcePicker display. */
export interface ResourceLabel {
  id: number;
  name: string;
}

/** Scale workplace form slice (API ids only; labels live in UI state). */
export interface ScaleWorkplaceFormState {
  scale_id: number | null;
  printer_id: number | null;
  template_id: number | null;
}

/** Display labels for a scale workplace (held outside the form object). */
export interface ScaleWorkplaceLabels {
  scaleLabel?: string;
  printerLabel?: string;
  templateLabel?: string;
}

/** Line options checkboxes. */
export interface LineOptionsFormState {
  must_scan_before_start: boolean;
  cam_disable: boolean;
  cam_hide: boolean;
  ask_befor_task: boolean;
  control_task_date: boolean;
  reserve_disabled: boolean;
  validate_ean: boolean;
  can_add_task: boolean;
}

/** Aggregation level editor state (API fields; labels / client keys live in UI state). */
export interface AggregationLevelFormState {
  id?: number;
  name: string;
  level: number;
  is_manual: boolean;
  use_count_method: boolean;
  template_id: number | null;
  plain_template_id: number | null;
  camera_id: number | null;
  print_camera_id: number | null;
  controller_id: number | null;
  divider_id: number | null;
  generator_type: number;
  two_cam_mode: boolean;
  aggr_timeout_ms: number;
  print_on_error: boolean;
  unit_camera_ids: number[];
  printer_ids: number[];
  aggregation_type: AggregationType;
}

/** Display labels for an aggregation level (held outside the form object). */
export interface AggregationLevelLabels {
  templateLabel?: string;
  plainTemplateLabel?: string;
  cameraLabel?: string;
  printCameraLabel?: string;
  controllerLabel?: string;
  dividerLabel?: string;
  unitCameraLabels?: Record<number, string>;
  printerLabels?: Record<number, string>;
}

/** Derived UI visibility and disable flags (Qt LineConfiguration state machine). */
export interface LineEditorVisibility {
  showExtendedTabs: boolean;
  showLineKind: boolean;
  disableLineKindToggle: boolean;

  //////
  hideExtendedTabs: boolean;
  /** Disable «Продукция» tab (manual / print-only line). */
  disableProductsTab: boolean;
  /** Hide printer/checkweir subtype panel (frmLineType_2). */
  showSerializationSubtype: boolean;
  /** Hide group_scan checkbox (doypack subtype). */
  showGroupScan: boolean;

  /** Show scale workplaces panel (`lineKind === 'scale'`, Qt gbSerialization page 2). */
  showScaleWorkplacesPanel: boolean;
  /** Show automated serialization fields (cameras, controller, print/checkweir). */
  showAutomatedSerialization: boolean;
  /** Show printer-mode serialization pickers (`outputMode === 'printer'`). */
  showPrinterSerialization: boolean;
  /** Show checkweir scale picker (`outputMode === 'checkweir'`). */
  showCheckweirPicker: boolean;
  
  /** Use odd/even camera labels (doypack subtype). */
  useDoypackCameraLabels: boolean;
  /** Show TSD notice on manual line page. */
  showManualLineNotice: boolean;
  /** Disable automated aggregation add menu item. */
  disableAutoAggregationAdd: boolean;
  /** Disable can_add_task option (gbSerialization manual page). */
  disableCanAddTask: boolean;
  /** Lock Авто/ТСД/Весовая segmented control on existing line. */
  
  /** Show line options checkboxes section. */
  showLineOptions: boolean;
}

/** POST/PATCH body for `/lines/`. */
export type LineWritePayload = components['schemas']['LinesSchema'];

/**
 * Line editor form = `/lines/` write object plus the nested configuration
 * slices saved by the same dialog.
 *
 * Line kind, output mode and automated subtype are derived from `is_manual`,
 * `output` / `is_scale` and `line_type` (see `resolveLineKind` and friends);
 * ids of deleted aggregation levels live in dialog state, not here.
 */
export type LineEditorFormState = LineWritePayload & {
  /** Line id from API (undefined for new line). */
  id?: number | null;
  /** `line_printed_dm_use` flag for this line (marking options setting). */
  allow_printed_dm: boolean;
  options: LineOptionsFormState;
  scale_stations: {
    first: ScaleWorkplaceFormState;
    second: ScaleWorkplaceFormState;
  };
  aggregation_levels: AggregationLevelFormState[];
  favourite_gtins: string[];
};

/** Top-level resource labels for the line editor (held outside the form object). */
export interface LineEditorResourceLabels {
  cameraLabel?: string;
  printedCameraLabel?: string;
  printerLabel?: string;
  printer2Label?: string;
  templateLabel?: string;
  plainTemplateLabel?: string;
  scaleLabel?: string;
  controllerLabel?: string;
  scale_stations: {
    first: ScaleWorkplaceLabels;
    second: ScaleWorkplaceLabels;
  };
  aggregation_levels: AggregationLevelLabels[];
}

import type { components } from '@/shared/api';

/** Brief line row from GET /lines/. */
export type LineListItem = components['schemas']['GetLinesSchema'];

export type AggregationType = 'automated' | 'autonomous' | 'manual';

/** Full line configuration from GET /lines/get_line/{id}. */
export type LineConfiguration = {
  id?: number | null;
  slaveid?: number | null;
  name: string;
  is_manual: boolean;
  is_scale: boolean;
  camera?: { id?: number | null; name?: string } | null;
  printed_codes_camera?: { id?: number | null; name?: string } | null;
  printer?: { id?: number | null; name?: string } | null;
  printer_2?: { id?: number | null; name?: string } | null;
  template?: { id?: number | null; name?: string } | null;
  plain_template?: { id?: number | null; name?: string } | null;
  scale?: { id?: number | null; name?: string; type?: number } | null;
  controller?: { id?: number | null; name?: string } | null;
  output: number;
  aggregation_levels?: AggregationLevelConfiguration[];
  wares?: Array<{ gtin?: string | null; name?: string | null }>;
  scale_stations?: ScaleWorkplacesConfiguration;
  one_s_code?: string | null;
  group_scan: boolean;
  external_line: boolean;
  options?: LineOptionsConfiguration;
  line_type?: string | null;
};

/** Aggregation level in full line configuration. */
export type AggregationLevelConfiguration = {
  id?: number | null;
  name: string;
  level: number;
  line_id?: number | null;
  use_count_method: boolean;
  template?: { id?: number | null; name?: string } | null;
  plain_template?: { id?: number | null; name?: string } | null;
  aggregate_camera?: { id?: number | null; name?: string } | null;
  aggregate_print_camera?: { id?: number | null; name?: string } | null;
  controller?: { id?: number | null; name?: string } | null;
  divider?: { id?: number | null; name?: string } | null;
  is_manual: boolean;
  generator_type: number;
  two_cam_mode: boolean;
  aggr_timeout_ms: number;
  print_empty_label_on_error?: boolean;
  unit_cameras?: Array<{ id?: number | null; name?: string }>;
  printers?: Array<{ id?: number | null; name?: string }>;
  aggregation_type: AggregationType;
};

/** Scale workplace settings in line configuration. */
export type ScaleWorkplaceConfiguration = {
  scale?: { id?: number | null; name?: string } | null;
  printer?: { id?: number | null; name?: string } | null;
  template?: { id?: number | null; name?: string } | null;
};

/** First/second scale workplaces. */
export type ScaleWorkplacesConfiguration = {
  first?: ScaleWorkplaceConfiguration;
  second?: ScaleWorkplaceConfiguration;
};

/** Line runtime options from configuration. */
export type LineOptionsConfiguration = components['schemas']['LinesOptionsSchema-Output'];

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

/** Scale workplace form slice. */
export interface ScaleWorkplaceFormState {
  scale_id: number | null;
  printer_id: number | null;
  template_id: number | null;
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

/** Aggregation level editor state. */
export interface AggregationLevelFormState {
  clientKey: string;
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
  templateLabel?: string;
  plainTemplateLabel?: string;
  cameraLabel?: string;
  printCameraLabel?: string;
  controllerLabel?: string;
  dividerLabel?: string;
  unitCameraLabels?: Record<number, string>;
  printerLabels?: Record<number, string>;
  aggregation_type: AggregationType;
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

/** Full line editor form state. */
export interface LineEditorFormState {
  /** Line id from API (undefined for new line). */
  id?: number | null;
  /** Slave server id when line belongs to external server. */
  slaveid?: number | null;
  /** Original is_manual from loaded configuration (Qt tabFavProducts lock). */
  loaded_is_manual: boolean;
  name: string;
  one_s_code: string;
  lineKind: LineKind;
  automatedSubtype: AutomatedLineSubtype;
  output: number;
  outputMode: LineOutputMode;
  external_line: boolean;
  print_only_no_verify: boolean;
  group_scan: boolean;
  is_scale: boolean;
  allow_printed_dm: boolean;
  camera_id: number | null;
  printed_codes_camera_id: number | null;
  printer_id: number | null;
  printer_2_id: number | null;
  template_id: number | null;
  plain_template_id: number | null;
  scale_id: number | null;
  new_chw_scale_id: number | null;
  controller_id: number | null;
  cameraLabel?: string;
  printedCodesCameraLabel?: string;
  printerLabel?: string;
  printer2Label?: string;
  templateLabel?: string;
  plainTemplateLabel?: string;
  scaleLabel?: string;
  newChwScaleLabel?: string;
  controllerLabel?: string;
  options: LineOptionsFormState;
  scale_stations: {
    first: ScaleWorkplaceFormState;
    second: ScaleWorkplaceFormState;
  };
  aggregation_levels: AggregationLevelFormState[];
  deleted_aggregation_level_ids: number[];
  favourite_gtins: string[];
  has_lines_options: boolean;
}

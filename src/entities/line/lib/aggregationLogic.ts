/** Aggregation logic mode (parity with apps.monitor.logic.aggregation.data.AggregationLogicType). */
export const AGGREGATION_LOGIC_TYPE = {
  COUNT_NO_CAM: {
    value: 0,
    description: 'Счётная агрегация без камер',
  },
  COUNT_BY_CAM: {
    value: 1,
    description: 'Счётная агрегация по камере',
  },
  CAM_FULL_SCAN: {
    value: 2,
    description: 'Агрегация по камере с полным считыванием',
  },
  MULTICAM: {
    value: 3,
    description: 'Агрегация с мультикамерами по ручьям',
  },
  TWOCAM: {
    value: 4,
    description: 'Агрегация по двум камерам',
  },
  MULTICOUNT: {
    value: 5,
    description: 'Счётная агрегация с мультикамерами',
  },
  CAM_PREAGGR_WITH_TWO_CODES: {
    value: 6,
    description:
      'Агрегация с преагергатами и сборкой считыванием двух кодов (состава и агрегата)',
  },
  CAM_PREAGGR_COUNT: {
    value: 7,
    description:
      'Счётная агрегация с преагергатами и сборкой считыванием двух кодов (состава и агрегата)',
  },
  COUNT_NO_CAM_GROUP: {
    value: 8,
    description: 'Групповая агрегация без камер',
  },
} as const;

export type AggregationLogicTypeValue =
  (typeof AGGREGATION_LOGIC_TYPE)[keyof typeof AGGREGATION_LOGIC_TYPE];

/** Input slice for aggregation mode resolution (Qt get_aggr_logic_type parity). */
export interface AggregationLogicInput {
  name: string;
  level: number;
  use_count_method: boolean;
  two_cam_mode: boolean;
  aggr_timeout_ms: number;
  camera_id: number | null;
  print_camera_id: number | null;
  unit_camera_ids: number[];
}

/** Thrown when aggregation settings do not match any known logic type. */
export class MisconfiguredAggregation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MisconfiguredAggregation';
  }
}

/**
 * Resolves aggregation logic type from level configuration (Qt get_aggr_logic_type).
 */
export function getAggrLogicType(data: AggregationLogicInput): AggregationLogicTypeValue {
  const isCount = data.use_count_method;
  const unitCamCount = data.unit_camera_ids.length;
  const aggrCam = data.camera_id !== null;
  const isTwoCam = data.two_cam_mode;

  if (isCount && unitCamCount > 0 && aggrCam && isTwoCam && !data.aggr_timeout_ms) {
    return AGGREGATION_LOGIC_TYPE.CAM_PREAGGR_COUNT;
  }
  if (!isCount && unitCamCount === 1 && aggrCam && isTwoCam) {
    if (!data.aggr_timeout_ms) {
      return AGGREGATION_LOGIC_TYPE.CAM_PREAGGR_WITH_TWO_CODES;
    }
    return AGGREGATION_LOGIC_TYPE.TWOCAM;
  }
  if (isCount && unitCamCount === 0) {
    return AGGREGATION_LOGIC_TYPE.COUNT_NO_CAM;
  }
  if (!isCount && unitCamCount === 0) {
    return AGGREGATION_LOGIC_TYPE.COUNT_NO_CAM_GROUP;
  }
  if (isCount && unitCamCount === 1 && !isTwoCam) {
    return AGGREGATION_LOGIC_TYPE.COUNT_BY_CAM;
  }
  if (!isCount && unitCamCount === 1 && !isTwoCam) {
    return AGGREGATION_LOGIC_TYPE.CAM_FULL_SCAN;
  }
  if (!isCount && unitCamCount > 1) {
    return AGGREGATION_LOGIC_TYPE.MULTICAM;
  }
  if (isCount && unitCamCount > 1) {
    return AGGREGATION_LOGIC_TYPE.MULTICOUNT;
  }

  throw new MisconfiguredAggregation(
    `[${data.name} <${data.level}>] Некорректные настройки агрегации!\nПроверьте настройки!`,
  );
}

/** Whether aggregate print camera is configured (Qt is_aggr_print_cam_used). */
export function isAggrPrintCamUsed(data: AggregationLogicInput): boolean {
  return data.print_camera_id !== null;
}

/** Whether aggregate control camera mode is active (Qt is_control_used). */
export function isControlUsed(data: AggregationLogicInput): boolean {
  return data.camera_id !== null && !data.two_cam_mode;
}

/** Resolved aggregation mode label and validity for lblAggregationMode. */
export interface AggregationModeLabel {
  text: string;
  isValid: boolean;
}

/**
 * Builds lblAggregationMode text and color state (Qt AggregationLevel._update_mode).
 */
export function formatAggregationModeLabel(data: AggregationLogicInput): AggregationModeLabel {
  try {
    const aggrMode = getAggrLogicType(data);
    let resultStr = aggrMode.description;
    if (isControlUsed(data)) {
      resultStr += '\n с контролем агрегата';
    }
    if (aggrMode.value === AGGREGATION_LOGIC_TYPE.CAM_FULL_SCAN.value && isAggrPrintCamUsed(data)) {
      resultStr += '\n с преагрегацией';
    }
    return { text: resultStr, isValid: true };
  } catch (error) {
    const text =
      error instanceof MisconfiguredAggregation
        ? error.message
        : 'Некорректно настроена агрегация!';
    return { text, isValid: false };
  }
}

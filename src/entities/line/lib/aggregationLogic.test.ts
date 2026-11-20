import { describe, expect, it } from 'vitest';
import {
  AGGREGATION_LOGIC_TYPE,
  formatAggregationModeLabel,
  getAggrLogicType,
  MisconfiguredAggregation,
} from './aggregationLogic';


const base: Parameters<typeof getAggrLogicType>[0] = {
  name: 'Test',
  level: 1,
  use_count_method: false,
  two_cam_mode: false,
  aggr_timeout_ms: 0,
  camera_id: null,
  print_camera_id: null,
  unit_camera_ids: [],
};

describe('getAggrLogicType', () => {
  it('returns COUNT_NO_CAM_GROUP when no count and no unit cameras', () => {
    expect(getAggrLogicType(base).value).toBe(AGGREGATION_LOGIC_TYPE.COUNT_NO_CAM_GROUP.value);
  });

  it('returns COUNT_NO_CAM when count method and no unit cameras', () => {
    expect(
      getAggrLogicType({ ...base, use_count_method: true }).value,
    ).toBe(AGGREGATION_LOGIC_TYPE.COUNT_NO_CAM.value);
  });

  it('returns CAM_FULL_SCAN for single unit camera without two-cam mode', () => {
    expect(
      getAggrLogicType({
        ...base,
        unit_camera_ids: [10],
        camera_id: 20,
      }).value,
    ).toBe(AGGREGATION_LOGIC_TYPE.CAM_FULL_SCAN.value);
  });

  it('returns TWOCAM when two-cam with timeout', () => {
    expect(
      getAggrLogicType({
        ...base,
        unit_camera_ids: [10],
        camera_id: 20,
        two_cam_mode: true,
        aggr_timeout_ms: 2000,
      }).value,
    ).toBe(AGGREGATION_LOGIC_TYPE.TWOCAM.value);
  });

  it('throws MisconfiguredAggregation for invalid combination', () => {
    expect(() =>
      getAggrLogicType({
        ...base,
        use_count_method: true,
        unit_camera_ids: [10],
        camera_id: 20,
        two_cam_mode: true,
        aggr_timeout_ms: 2000,
      }),
    ).toThrow(MisconfiguredAggregation);
  });
});

describe('formatAggregationModeLabel', () => {
  it('marks valid configuration green text content', () => {
    const result = formatAggregationModeLabel({
      ...base,
      unit_camera_ids: [1],
      camera_id: 2,
    });
    expect(result.isValid).toBe(true);
    expect(result.text).toContain(AGGREGATION_LOGIC_TYPE.CAM_FULL_SCAN.description);
  });

  it('appends preaggregation note when print camera set in CAM_FULL_SCAN', () => {
    const result = formatAggregationModeLabel({
      ...base,
      unit_camera_ids: [1],
      camera_id: 2,
      print_camera_id: 3,
    });
    expect(result.text).toContain('с преагрегацией');
  });

  it('returns error text for misconfigured aggregation', () => {
    const result = formatAggregationModeLabel({
      ...base,
      unit_camera_ids: [1],
      two_cam_mode: true,
    });
    expect(result.isValid).toBe(false);
    expect(result.text).toContain('Некорректные настройки');
  });
});

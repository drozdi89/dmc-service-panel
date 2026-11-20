import { describe, expect, it } from 'vitest';
import {
  applyOutputModeChange,
  buildLinePayload,
  buildLinePrintedDmSettings,
  canAddAutomatedAggregationLevel,
  canSwapAggregationLevels,
  computeLineEditorVisibility,
  createDefaultLineFormState,
  mapLineConfigurationToForm,
  reindexAggregationLevels,
  validateLineForm,
  validateManualAggregationLevel,
} from './lineFormMapping';
import { LINE_TYPE } from './constants';
import type { AggregationLevelFormState } from './types';

describe('computeLineEditorVisibility', () => {
  it('disables products tab only when line was loaded as manual', () => {
    const base = createDefaultLineFormState();
    expect(
      computeLineEditorVisibility({ ...base, lineKind: 'manual' }, false).disableProductsTab,
    ).toBe(false);
    expect(
      computeLineEditorVisibility({ ...base, loaded_is_manual: true }, false).disableProductsTab,
    ).toBe(true);
    expect(
      computeLineEditorVisibility(
        { ...base, lineKind: 'manual', loaded_is_manual: true },
        false,
      ).disableProductsTab,
    ).toBe(true);
  });

  it('hides extended tabs for external or print-only lines', () => {
    const base = createDefaultLineFormState();
    const external = computeLineEditorVisibility({ ...base, external_line: true }, false);
    expect(external.hideAggregationTab).toBe(true);
    expect(external.hideProductsTab).toBe(true);
    expect(external.showLineOptions).toBe(false);

    const printOnly = computeLineEditorVisibility(
      { ...base, print_only_no_verify: true },
      false,
    );
    expect(printOnly.hideAggregationTab).toBe(true);
    expect(printOnly.showManualLineNotice).toBe(false);
  });

  it('disables line kind toggle for existing lines', () => {
    const base = createDefaultLineFormState();
    expect(computeLineEditorVisibility(base, true).disableLineKindToggle).toBe(false);
    expect(computeLineEditorVisibility(base, false).disableLineKindToggle).toBe(true);
  });

  it('shows automated serialization and printer pickers in printer mode', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility(
      { ...base, lineKind: 'automated', outputMode: 'printer' },
      true,
    );
    expect(vis.showAutomatedSerialization).toBe(true);
    expect(vis.showPrinterSerialization).toBe(true);
    expect(vis.showCheckweirPicker).toBe(false);
    expect(vis.hideSerializationSubtype).toBe(false);
  });

  it('shows checkweir picker instead of printer serialization in checkweir mode', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility(
      { ...base, lineKind: 'automated', outputMode: 'checkweir' },
      true,
    );
    expect(vis.showPrinterSerialization).toBe(false);
    expect(vis.showCheckweirPicker).toBe(true);
  });

  it('shows scale workplaces panel only for scale line kind', () => {
    const base = createDefaultLineFormState();
    expect(computeLineEditorVisibility({ ...base, lineKind: 'scale' }, true).showScaleWorkplacesPanel).toBe(
      true,
    );
    expect(
      computeLineEditorVisibility({ ...base, lineKind: 'automated' }, true).showScaleWorkplacesPanel,
    ).toBe(false);
    expect(
      computeLineEditorVisibility(
        { ...base, lineKind: 'scale', external_line: true },
        true,
      ).showScaleWorkplacesPanel,
    ).toBe(false);
    // outputMode must not drive workplaces (Qt: btnScaleStation / lineKind)
    expect(
      computeLineEditorVisibility(
        { ...base, lineKind: 'automated', outputMode: 'printer' },
        true,
      ).showScaleWorkplacesPanel,
    ).toBe(false);
  });

  it('shows manual notice and disables task/auto-aggr options for TSD line', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility({ ...base, lineKind: 'manual' }, true);
    expect(vis.showManualLineNotice).toBe(true);
    expect(vis.showAutomatedSerialization).toBe(false);
    expect(vis.showLineOptions).toBe(false);
    expect(vis.disableCanAddTask).toBe(true);
    expect(vis.disableAutoAggregationAdd).toBe(true);
  });

  it('uses doypack camera labels and hides group_scan', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility(
      { ...base, lineKind: 'automated', automatedSubtype: 'doypack' },
      true,
    );
    expect(vis.useDoypackCameraLabels).toBe(true);
    expect(vis.hideGroupScan).toBe(true);
  });

  it('hides extended main-tab sections when external_line is set', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility({ ...base, external_line: true }, true);
    expect(vis.showAutomatedSerialization).toBe(false);
    expect(vis.showScaleWorkplacesPanel).toBe(false);
    expect(vis.showLineOptions).toBe(false);
  });
});

describe('validateLineForm', () => {
  it('requires line name', () => {
    const state = createDefaultLineFormState();
    expect(validateLineForm(state)).toBe('Укажите название производственной линии');
  });

  it('accepts valid state', () => {
    const state = { ...createDefaultLineFormState(), name: 'Линия 1' };
    expect(validateLineForm(state)).toBeNull();
  });

  it('rejects duplicate serialization printers', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Auto',
      lineKind: 'automated' as const,
      outputMode: 'printer' as const,
      printer_id: 1,
      printer_2_id: 1,
    };
    expect(validateLineForm(state)).toBe(
      'Второй принтер не может совпадать с принтером сериализации',
    );
  });

  it('rejects manual aggregation level with printer/template mismatch', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Line 1',
      aggregation_levels: [
        {
          clientKey: 'm1',
          name: 'Ручной 1',
          level: 0,
          is_manual: true,
          use_count_method: false,
          template_id: 2,
          plain_template_id: null,
          camera_id: null,
          print_camera_id: null,
          controller_id: null,
          divider_id: null,
          generator_type: 0,
          two_cam_mode: false,
          aggr_timeout_ms: 2000,
          print_on_error: false,
          unit_camera_ids: [],
          printer_ids: [],
        },
      ],
    };
    expect(validateLineForm(state)).toContain('Ручной 1');
    expect(validateLineForm(state)).toContain('принтер');
  });
});

describe('mapLineConfigurationToForm', () => {
  const baseConfig = {
    name: 'Line 1',
    is_manual: false,
    is_scale: false,
    output: 0,
    group_scan: false,
    external_line: false,
  };

  it('maps scale to new_chw_scale_id in printer mode', () => {
    const form = mapLineConfigurationToForm({
      ...baseConfig,
      output: 0,
      scale: { id: 42, name: 'New CHW' },
    });
    expect(form.new_chw_scale_id).toBe(42);
    expect(form.newChwScaleLabel).toBe('New CHW');
    expect(form.scale_id).toBeNull();
    expect(form.scaleLabel).toBeUndefined();
  });

  it('maps scale to scale_id in checkweir mode', () => {
    const form = mapLineConfigurationToForm({
      ...baseConfig,
      output: 1,
      scale: { id: 7, name: 'Checkweir' },
    });
    expect(form.scale_id).toBe(7);
    expect(form.scaleLabel).toBe('Checkweir');
    expect(form.new_chw_scale_id).toBeNull();
    expect(form.newChwScaleLabel).toBeUndefined();
  });
});

describe('applyOutputModeChange', () => {
  it('migrates scale from new CHW to checkweir field', () => {
    const state = {
      ...createDefaultLineFormState(),
      outputMode: 'printer' as const,
      new_chw_scale_id: 5,
      newChwScaleLabel: 'Scale A',
    };
    expect(applyOutputModeChange(state, 'checkweir')).toEqual({
      outputMode: 'checkweir',
      scale_id: 5,
      scaleLabel: 'Scale A',
      new_chw_scale_id: null,
      newChwScaleLabel: undefined,
    });
  });

  it('migrates scale from checkweir to new CHW field', () => {
    const state = {
      ...createDefaultLineFormState(),
      outputMode: 'checkweir' as const,
      scale_id: 8,
      scaleLabel: 'Scale B',
    };
    expect(applyOutputModeChange(state, 'printer')).toEqual({
      outputMode: 'printer',
      new_chw_scale_id: 8,
      newChwScaleLabel: 'Scale B',
      scale_id: null,
      scaleLabel: undefined,
    });
  });
});

describe('buildLinePayload', () => {
  it('clears devices for manual line', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Manual',
      lineKind: 'manual' as const,
      camera_id: 5,
      printer_id: 6,
    };
    const payload = buildLinePayload(state);
    expect(payload.is_manual).toBe(true);
    expect(payload.camera_id).toBeNull();
    expect(payload.printer_id).toBeNull();
  });

  it('sets PRINTNOVERIFY line type', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Print only',
      print_only_no_verify: true,
      lineKind: 'automated' as const,
    };
    const payload = buildLinePayload(state);
    expect(payload.line_type).toBe(LINE_TYPE.PRINT_NO_VERIFY);
    expect(payload.is_manual).toBe(true);
  });

  it('maps checkweir output', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Auto',
      outputMode: 'checkweir' as const,
      scale_id: 12,
      new_chw_scale_id: 99,
    };
    const payload = buildLinePayload(state);
    expect(payload.output).toBe(1);
    expect(payload.scale_id).toBe(12);
  });

  it('maps new CHW scale in printer mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Auto',
      outputMode: 'printer' as const,
      scale_id: 12,
      new_chw_scale_id: 99,
    };
    const payload = buildLinePayload(state);
    expect(payload.output).toBe(0);
    expect(payload.scale_id).toBe(99);
  });

  it('maps printer_2_id to printer_id_s in printer mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Auto',
      lineKind: 'automated' as const,
      outputMode: 'printer' as const,
      printer_id: 10,
      printer_2_id: 20,
    };
    const payload = buildLinePayload(state);
    expect(payload.printer_id).toBe(10);
    expect(payload.printer_id_s).toBe(20);
  });

  it('excludes second printer in checkweir mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      name: 'Auto',
      lineKind: 'automated' as const,
      outputMode: 'checkweir' as const,
      printer_id: 10,
      printer_2_id: 20,
    };
    const payload = buildLinePayload(state);
    expect(payload.printer_id).toBeNull();
    expect(payload.printer_id_s).toBeNull();
  });

  it('excludes serialization printers for manual and scale lines', () => {
    const manual = buildLinePayload({
      ...createDefaultLineFormState(),
      name: 'Manual',
      lineKind: 'manual',
      outputMode: 'printer',
      printer_id: 1,
      printer_2_id: 2,
    });
    expect(manual.printer_id).toBeNull();
    expect(manual.printer_id_s).toBeNull();

    const scale = buildLinePayload({
      ...createDefaultLineFormState(),
      name: 'Scale',
      lineKind: 'scale',
      outputMode: 'printer',
      printer_id: 3,
      printer_2_id: 4,
    });
    expect(scale.printer_id).toBeNull();
    expect(scale.printer_id_s).toBeNull();
  });
});

describe('aggregation level helpers', () => {
  const manualLevel: AggregationLevelFormState = {
    clientKey: 'm1',
    name: 'Manual',
    level: 1,
    is_manual: true,
    use_count_method: false,
    template_id: null,
    plain_template_id: null,
    camera_id: null,
    print_camera_id: null,
    controller_id: null,
    divider_id: null,
    generator_type: 0,
    two_cam_mode: false,
    aggr_timeout_ms: 2000,
    print_on_error: false,
    unit_camera_ids: [],
    printer_ids: [],
  };

  const autoLevel: AggregationLevelFormState = {
    ...manualLevel,
    clientKey: 'a1',
    name: 'Auto',
    is_manual: false,
  };

  it('blocks automated level after manual', () => {
    expect(canAddAutomatedAggregationLevel([autoLevel, manualLevel])).toBe(false);
    expect(canAddAutomatedAggregationLevel([autoLevel])).toBe(true);
  });

  it('prevents swapping manual levels', () => {
    expect(canSwapAggregationLevels([autoLevel, manualLevel], 0, 1)).toBe(false);
    expect(canSwapAggregationLevels([autoLevel, autoLevel], 0, 1)).toBe(true);
  });

  it('reindexes levels sequentially', () => {
    const reindexed = reindexAggregationLevels([
      { ...autoLevel, level: 5 },
      { ...manualLevel, level: 9 },
    ]);
    expect(reindexed.map((level) => level.level)).toEqual([0, 1]);
  });
});

describe('validateManualAggregationLevel', () => {
  it('accepts both printer and template or neither', () => {
    expect(validateManualAggregationLevel({ printer_ids: [1], template_id: 2 })).toBeNull();
    expect(validateManualAggregationLevel({ printer_ids: [], template_id: null })).toBeNull();
  });

  it('rejects template without printer', () => {
    expect(validateManualAggregationLevel({ printer_ids: [], template_id: 2 })).toContain('принтер');
  });

  it('rejects printer without template', () => {
    expect(validateManualAggregationLevel({ printer_ids: [1], template_id: null })).toContain('шаблон');
  });
});

describe('buildLinePrintedDmSettings', () => {
  it('merges line flag into existing map', () => {
    const settings = buildLinePrintedDmSettings(3, true, '{"1": false}');
    expect(settings).toHaveLength(1);
    expect(JSON.parse(settings[0].options_value)).toEqual({ '1': false, '3': true });
  });
});

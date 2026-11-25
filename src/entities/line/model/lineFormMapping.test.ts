import { describe, expect, it } from 'vitest';
import {
  buildLinePayload,
  buildLinePrintedDmSettings,
  canAddAutomatedAggregationLevel,
  canSwapAggregationLevels,
  computeLineEditorVisibility,
  createDefaultLineFormState,
  mapLineConfigurationToForm,
  mapLineConfigurationToLabels,
  outputModeToFields,
  reindexAggregationLevels,
  resolveAutomatedSubtype,
  resolveLineKind,
  resolveOutputMode,
  validateLineForm,
  validateManualAggregationLevel,
} from './lineFormMapping';
import { LINE_TYPE } from './constants';
import type { AggregationLevelFormState } from './types';

describe('computeLineEditorVisibility', () => {
  it('disables products tab only when the loaded line was manual', () => {
    const base = createDefaultLineFormState();
    expect(
      computeLineEditorVisibility({ ...base, is_manual: true }, false, false)
        .disableProductsTab,
    ).toBe(false);
    expect(computeLineEditorVisibility(base, false, true).disableProductsTab).toBe(true);
    expect(
      computeLineEditorVisibility({ ...base, is_manual: true }, false, true)
        .disableProductsTab,
    ).toBe(true);
  });

  it('hides extended tabs for external or print-only lines', () => {
    const base = createDefaultLineFormState();
    const external = computeLineEditorVisibility({ ...base, external_line: true }, false);
    expect(external.hideExtendedTabs).toBe(true);
    expect(external.showLineOptions).toBe(false);

    const printOnly = computeLineEditorVisibility(
      { ...base, line_type: LINE_TYPE.PRINT_NO_VERIFY },
      false,
    );
    expect(printOnly.hideExtendedTabs).toBe(true);
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
      { ...base, is_manual: false, output: 0, is_scale: false },
      true,
    );
    expect(vis.showAutomatedSerialization).toBe(true);
    expect(vis.showPrinterSerialization).toBe(true);
    expect(vis.showCheckweirPicker).toBe(false);
    expect(vis.showSerializationSubtype).toBe(true);
  });

  it('shows checkweir picker instead of printer serialization in checkweir mode', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility(
      { ...base, is_manual: false, output: 1, is_scale: false },
      true,
    );
    expect(vis.showPrinterSerialization).toBe(false);
    expect(vis.showCheckweirPicker).toBe(true);
  });

  it('shows scale workplaces panel only for scale output mode', () => {
    const base = createDefaultLineFormState();
    expect(
      computeLineEditorVisibility(
        { ...base, is_manual: false, output: 1, is_scale: true },
        true,
      ).showScaleWorkplacesPanel,
    ).toBe(true);
    expect(
      computeLineEditorVisibility({ ...base, is_manual: false }, true).showScaleWorkplacesPanel,
    ).toBe(false);
    expect(
      computeLineEditorVisibility(
        { ...base, is_manual: false, output: 1, is_scale: true, external_line: true },
        true,
      ).hideExtendedTabs,
    ).toBe(true);
    expect(
      computeLineEditorVisibility(
        { ...base, is_manual: false, output: 0, is_scale: false },
        true,
      ).showScaleWorkplacesPanel,
    ).toBe(false);
  });

  it('shows manual notice and disables task/auto-aggr options for TSD line', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility({ ...base, is_manual: true }, true);
    expect(vis.showManualLineNotice).toBe(true);
    expect(vis.showAutomatedSerialization).toBe(false);
    expect(vis.showLineOptions).toBe(true);
    expect(vis.disableCanAddTask).toBe(true);
    expect(vis.disableAutoAggregationAdd).toBe(true);
  });

  it('uses doypack camera labels and hides group_scan', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility(
      { ...base, is_manual: false, line_type: LINE_TYPE.DOYPACK },
      true,
    );
    expect(vis.useDoypackCameraLabels).toBe(true);
    expect(vis.showGroupScan).toBe(false);
  });

  it('hides extended main-tab sections when external_line is set', () => {
    const base = createDefaultLineFormState();
    const vis = computeLineEditorVisibility({ ...base, external_line: true }, true);
    expect(vis.hideExtendedTabs).toBe(true);
    expect(vis.showScaleWorkplacesPanel).toBe(false);
    expect(vis.showLineOptions).toBe(false);
  });
});

describe('resolve helpers', () => {
  it('maps is_manual / line_type / output to UI radios', () => {
    expect(resolveLineKind({ is_manual: true })).toBe('manual');
    expect(resolveLineKind({ is_manual: false })).toBe('automated');
    expect(resolveAutomatedSubtype(LINE_TYPE.DOYPACK)).toBe('doypack');
    expect(resolveAutomatedSubtype(LINE_TYPE.DEFAULT)).toBe('default');
    expect(resolveOutputMode({ output: 0, is_scale: false })).toBe('printer');
    expect(resolveOutputMode({ output: 1, is_scale: false })).toBe('checkweir');
    expect(resolveOutputMode({ output: 1, is_scale: true })).toBe('scale');
  });

  it('maps output mode radio back to output / is_scale', () => {
    expect(outputModeToFields('printer')).toEqual({ output: 0, is_scale: false });
    expect(outputModeToFields('checkweir')).toEqual({ output: 1, is_scale: false });
    expect(outputModeToFields('scale')).toEqual({ output: 1, is_scale: true });
  });
});

describe('validateLineForm', () => {
  it('requires line name', () => {
    const state = createDefaultLineFormState();
    expect(validateLineForm(state)).toBe('Укажите название производственной линии');
  });

  it('accepts valid state', () => {
    const state = { ...createDefaultLineFormState(), linename: 'Линия 1' };
    expect(validateLineForm(state)).toBeNull();
  });

  it('rejects duplicate serialization printers', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Auto',
      is_manual: false,
      output: 0,
      is_scale: false,
      printer_id: 1,
      printer_id_s: 1,
    };
    expect(validateLineForm(state)).toBe(
      'Второй принтер не может совпадать с принтером сериализации',
    );
  });

  it('rejects manual aggregation level with printer/template mismatch', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Line 1',
      aggregation_levels: [
        {
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
          aggregation_type: 'manual' as const,
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

  it('maps GET nested devices onto LinesSchema write fields', () => {
    const form = mapLineConfigurationToForm({
      ...baseConfig,
      output: 0,
      one_s_code: '1C-1',
      printer: { id: 10, name: 'P1' },
      printer_2: { id: 20, name: 'P2' },
      printed_codes_camera: { id: 3, name: 'Cam print' },
      scale: { id: 42, name: 'New CHW' },
    });
    expect(form.linename).toBe('Line 1');
    expect(form.one_s_line_code).toBe('1C-1');
    expect(form.printer_id).toBe(10);
    expect(form.printer_id_s).toBe(20);
    expect(form.printed_camera_id).toBe(3);
    expect(form.scale_id).toBe(42);
    expect(form).not.toHaveProperty('lineKind');
    expect(form).not.toHaveProperty('outputMode');
    expect(form).not.toHaveProperty('deleted_aggregation_level_ids');

    const labels = mapLineConfigurationToLabels({
      ...baseConfig,
      printed_codes_camera: { id: 3, name: 'Cam print' },
      scale: { id: 42, name: 'New CHW' },
    });
    expect(labels.printedCameraLabel).toBe('Cam print');
    expect(labels.scaleLabel).toBe('New CHW');
  });

  it('maps checkweir scale onto the same scale_id field', () => {
    const form = mapLineConfigurationToForm({
      ...baseConfig,
      output: 1,
      scale: { id: 7, name: 'Checkweir' },
    });
    expect(form.scale_id).toBe(7);
    expect(form.output).toBe(1);
    expect(form.is_scale).toBe(false);
  });
});

describe('buildLinePayload', () => {
  it('clears devices for manual line', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Manual',
      is_manual: true,
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
      linename: 'Print only',
      line_type: LINE_TYPE.PRINT_NO_VERIFY,
      is_manual: false,
    };
    const payload = buildLinePayload(state);
    expect(payload.line_type).toBe(LINE_TYPE.PRINT_NO_VERIFY);
    expect(payload.is_manual).toBe(true);
  });

  it('keeps scale_id in checkweir mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Auto',
      output: 1,
      is_scale: false,
      scale_id: 12,
    };
    const payload = buildLinePayload(state);
    expect(payload.output).toBe(1);
    expect(payload.scale_id).toBe(12);
  });

  it('keeps scale_id in printer mode (Новый ЧВ)', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Auto',
      output: 0,
      is_scale: false,
      scale_id: 99,
    };
    const payload = buildLinePayload(state);
    expect(payload.output).toBe(0);
    expect(payload.scale_id).toBe(99);
  });

  it('keeps printer_id_s in printer mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Auto',
      is_manual: false,
      output: 0,
      is_scale: false,
      printer_id: 10,
      printer_id_s: 20,
    };
    const payload = buildLinePayload(state);
    expect(payload.printer_id).toBe(10);
    expect(payload.printer_id_s).toBe(20);
  });

  it('excludes second printer in checkweir mode', () => {
    const state = {
      ...createDefaultLineFormState(),
      linename: 'Auto',
      is_manual: false,
      output: 1,
      is_scale: false,
      printer_id: 10,
      printer_id_s: 20,
    };
    const payload = buildLinePayload(state);
    expect(payload.printer_id).toBeNull();
    expect(payload.printer_id_s).toBeNull();
  });

  it('excludes serialization printers for manual and scale lines', () => {
    const manual = buildLinePayload({
      ...createDefaultLineFormState(),
      linename: 'Manual',
      is_manual: true,
      output: 0,
      printer_id: 1,
      printer_id_s: 2,
    });
    expect(manual.printer_id).toBeNull();
    expect(manual.printer_id_s).toBeNull();

    const scale = buildLinePayload({
      ...createDefaultLineFormState(),
      linename: 'Scale',
      is_manual: false,
      output: 1,
      is_scale: true,
      printer_id: 3,
      printer_id_s: 4,
    });
    expect(scale.printer_id).toBeNull();
    expect(scale.printer_id_s).toBeNull();
  });
});

describe('aggregation level helpers', () => {
  const manualLevel: AggregationLevelFormState = {
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
    aggregation_type: 'manual',
  };

  const autoLevel: AggregationLevelFormState = {
    ...manualLevel,
    name: 'Auto',
    is_manual: false,
    aggregation_type: 'automated',
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
    expect(JSON.parse(settings[0].value)).toEqual({ '1': false, '3': true });
  });
});

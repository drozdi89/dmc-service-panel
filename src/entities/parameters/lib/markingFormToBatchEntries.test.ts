import { describe, expect, it } from 'vitest';
import type { ParametersSettingsBundle } from '../model/types';
import {
  selectFormData,
  prepareSave,
  statisticsFormToBatchEntries,
} from './markingFormToBatchEntries';

const bundle = {
  gln: '1234567890123',
  minimal_culling_grade: '',
  export_data_path: '/export',
  use_vsd_import: true,
  vsd_import_path: '/vsd',
  store_pdf_on_task_finish: true,
  disable_statistics: true,
  disable_statistics_export: false,
} as ParametersSettingsBundle;

describe('prepareSave', () => {
  it('omits slave-hidden fields in slave mode', () => {
    const names = prepareSave(bundle, true).map((entry) => entry.name);
    expect(names).toContain('gln');
    expect(names).not.toContain('export_data_path');
    expect(names).not.toContain('use_vsd_import');
    expect(names).not.toContain('vsd_import_path');
    expect(names).not.toContain('store_pdf_on_task_finish');
  });

  it('includes slave-hidden fields outside slave mode', () => {
    const names = prepareSave(bundle, false).map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'export_data_path',
        'use_vsd_import',
        'vsd_import_path',
        'store_pdf_on_task_finish',
      ]),
    );
  });

  it('includes series_lease_block_size', () => {
    const withLease = {
      ...bundle,
      series_lease_block_size: 500,
    } as ParametersSettingsBundle;
    const entry = prepareSave(withLease, false).find(
      (item) => item.name === 'series_lease_block_size',
    );
    expect(entry).toEqual({ name: 'series_lease_block_size', value: 500 });
  });
});

describe('statisticsFormToBatchEntries', () => {
  it('returns exactly two statistics entries', () => {
    expect(statisticsFormToBatchEntries(bundle)).toEqual([
      { name: 'disable_statistics', value: true },
      { name: 'disable_statistics_export', value: false },
    ]);
  });
});

describe('selectFormData', () => {
  it('defaults empty culling grade to E', () => {
    expect(selectFormData(bundle).minimal_culling_grade).toBe('E');
  });
});

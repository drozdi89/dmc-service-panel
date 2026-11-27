import type { MarkingOptionEntry, ParametersSettingsBundle } from '../model/types';

/**
 * Settings bundle with UI defaults for empty values.
 *
 * @param bundle - Settings bundle from API.
 */
export function selectFormData(
  bundle: ParametersSettingsBundle,
): ParametersSettingsBundle {
  return {
    ...bundle,
    minimal_culling_grade: bundle.minimal_culling_grade || 'E',
  };
}

/**
 * Converts marking form values to batch API entries.
 *
 * @param values - Form values (settings bundle shape).
 * @param isSlaveMode - When true, slave-hidden fields are omitted.
 */
export function prepareSave(
  values: ParametersSettingsBundle,
  isSlaveMode: boolean,
): MarkingOptionEntry[] {
  const entries: MarkingOptionEntry[] = [
    { name: 'use_special_numbers', value: values.use_special_numbers },
    { name: 'batch_number_mandatory', value: values.batch_number_mandatory },
    { name: 'use_batch_number_template', value: values.use_batch_number_template },
    { name: 'batch_template', value: values.batch_template },
    { name: 'dm_lifetime_days', value: values.dm_lifetime_days },
    { name: 'dm_lifetime_warning_days', value: values.dm_lifetime_warning_days },
    { name: 'gln', value: values.gln },
    { name: 'tasks_limit', value: values.tasks_limit },
    { name: 'man_date_switch_time', value: values.man_date_switch_time },
    { name: 'minimal_culling_grade', value: values.minimal_culling_grade },
    { name: 'man_date_switch_enabled', value: values.man_date_switch_enabled },
    { name: 'sscc_with_ai00_enabled', value: values.sscc_with_ai00_enabled },
    { name: 'sscc_generate_on_new_task', value: values.sscc_generate_on_new_task },
    { name: 'dm_is_introduced_option', value: values.dm_is_introduced_option },
    { name: 'calculate_mandate_by_days', value: values.calculate_mandate_by_days },
    { name: 'subacc_products_archived', value: values.subacc_products_archived },
    { name: 'series_lease_block_size', value: values.series_lease_block_size },
  ];

  if (!isSlaveMode) {
    entries.push(
      { name: 'export_data_path', value: values.export_data_path },
      { name: 'use_vsd_import', value: values.use_vsd_import },
      { name: 'vsd_import_path', value: values.vsd_import_path },
      { name: 'store_pdf_on_task_finish', value: values.store_pdf_on_task_finish },
    );
  }

  return entries;
}

/**
 * Entries for the statistics toggles section.
 *
 * @param values - Form values (settings bundle shape).
 */
export function statisticsFormToBatchEntries(
  values: Pick<ParametersSettingsBundle, 'disable_statistics' | 'disable_statistics_export'>,
): MarkingOptionEntry[] {
  return [
    { name: 'disable_statistics', value: values.disable_statistics },
    { name: 'disable_statistics_export', value: values.disable_statistics_export },
  ];
}

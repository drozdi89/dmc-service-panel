import { Alert, Card, Form, Space, Typography, message } from 'antd';
import { useMemo } from 'react';
import {
  useFtpConfigurationQuery,
  useSaveFtpConfigurationMutation,
  useSaveMarkingOptionsMutation,
  useSaveTeleBotSettingMutation,
  useSaveWatchdogConfigurationMutation,
  useSettingsBundleQuery,
  useSlaveConfigurationQuery,
  useTeleBotSettingQuery,
  useWatchdogConfigurationQuery,
  validateBatchTemplate,
  type FtpConfiguration,
  type MarkingOptionEntry,
  type ParametersSettingsBundle,
  type TeleBotSettingRow,
  type WatchdogConfiguration,
} from '@/entities/parameters';
import { FactoryNumbersSection } from '@/features/parameters-factory-numbers';
import { FtpSection } from '@/features/parameters-ftp';
import { MarkingOptionsSection } from '@/features/parameters-marking-options';
import { StatisticsSection } from '@/features/parameters-statistics';
import { TelegramSection } from '@/features/parameters-telegram';
import { WatchdogSection } from '@/features/parameters-watchdog';
import { PageSpinner } from '@/shared/ui/loading';

/**
 * Converts marking form values to batch API entries.
 *
 * @param values - Form values from MarkingOptionsSection.
 * @param isSlaveMode - When true, slave-hidden fields are omitted.
 */
function markingFormToBatchEntries(
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
 * Parameters admin page — marking options, Telegram, factory numbers, FTP, Watchdog, statistics.
 */
export default function ParametersPage() {
  const [markingForm] = Form.useForm<ParametersSettingsBundle>();
  const [telegramForm] = Form.useForm<TeleBotSettingRow>();
  const [ftpForm] = Form.useForm<FtpConfiguration>();
  const [watchdogForm] = Form.useForm<WatchdogConfiguration>();
  const [statisticsForm] = Form.useForm<ParametersSettingsBundle>();

  const bundleQuery = useSettingsBundleQuery();
  const slaveQuery = useSlaveConfigurationQuery();
  const teleBotQuery = useTeleBotSettingQuery();
  const watchdogQuery = useWatchdogConfigurationQuery();

  const isSlaveMode = slaveQuery.data?.slave_mode === true;
  const shouldLoadFtp = slaveQuery.isSuccess && !isSlaveMode;

  const ftpQuery = useFtpConfigurationQuery({
    enabled: shouldLoadFtp,
  });

  const initialLoading =
    bundleQuery.isLoading ||
    slaveQuery.isLoading ||
    teleBotQuery.isLoading ||
    watchdogQuery.isLoading ||
    (shouldLoadFtp && ftpQuery.isLoading);

  const loadError = useMemo(() => {
    const errors = [
      bundleQuery.error,
      slaveQuery.error,
      teleBotQuery.error,
      watchdogQuery.error,
      shouldLoadFtp ? ftpQuery.error : null,
    ].filter(Boolean);
    return errors[0] ?? null;
  }, [
    bundleQuery.error,
    slaveQuery.error,
    teleBotQuery.error,
    watchdogQuery.error,
    ftpQuery.error,
    shouldLoadFtp,
  ]);

  const showError = (error: Error) => message.error(error.message);

  const markingSaveMutation = useSaveMarkingOptionsMutation({
    onSuccess: () => {
      message.success('Настройки маркировки сохранены');
    },
    onError: showError,
  });

  const telegramSaveMutation = useSaveTeleBotSettingMutation({
    onSuccess: () => {
      message.success('Настройки Telegram сохранены');
    },
    onError: showError,
  });

  const ftpSaveMutation = useSaveFtpConfigurationMutation({
    onSuccess: () => {
      message.success('Настройки FTP сохранены');
    },
    onError: showError,
  });

  const watchdogSaveMutation = useSaveWatchdogConfigurationMutation({
    onSuccess: () => {
      message.success('Настройки Watchdog сохранены');
    },
    onError: showError,
  });

  const statisticsSaveMutation = useSaveMarkingOptionsMutation({
    onSuccess: () => {
      message.success('Настройки статистики сохранены');
    },
    onError: showError,
  });

  const handleMarkingSave = (values: ParametersSettingsBundle) => {
    const templateError = validateBatchTemplate(values.batch_template);
    if (templateError) {
      message.error(templateError);
      return;
    }
    markingSaveMutation.mutate(markingFormToBatchEntries(values, isSlaveMode));
  };

  if (initialLoading) {
    return <PageSpinner tip="Загрузка параметров…" />;
  }

  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить страницу параметров"
        description={loadError.message}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Параметры
      </Typography.Title>

      {isSlaveMode ? (
        <Alert
          type="info"
          showIcon
          message="Slave-режим"
          description="Часть настроек скрыта, как в Service Panel при включённом slave-режиме."
        />
      ) : null}

      <Card title="Настройки маркировки">
        <MarkingOptionsSection
          form={markingForm}
          initialValues={bundleQuery.data}
          isSlaveMode={isSlaveMode}
          saving={markingSaveMutation.isPending}
          onSave={handleMarkingSave}
        />
      </Card>

      <Card title="Telegram">
        <TelegramSection
          form={telegramForm}
          initialSetting={teleBotQuery.data}
          saving={telegramSaveMutation.isPending}
          onSave={(values) =>
            telegramSaveMutation.mutate({
              setting: values,
              existingId: teleBotQuery.data?.bot_setting_id ?? null,
            })
          }
        />
      </Card>

      <Card title="Заводские номера">
        <FactoryNumbersSection />
      </Card>

      {!isSlaveMode ? (
        <Card title="FTP-обмен">
          <FtpSection
            form={ftpForm}
            initialConfig={ftpQuery.data}
            saving={ftpSaveMutation.isPending}
            onSave={(values) => ftpSaveMutation.mutate(values)}
          />
        </Card>
      ) : null}

      <Card title="Watchdog">
        <WatchdogSection
          form={watchdogForm}
          initialConfig={watchdogQuery.data}
          saving={watchdogSaveMutation.isPending}
          onSave={(values) => watchdogSaveMutation.mutate(values)}
        />
      </Card>

      <Card title="Статистика">
        <StatisticsSection
          form={statisticsForm}
          initialValues={bundleQuery.data}
          saving={statisticsSaveMutation.isPending}
          onSave={(values) =>
            statisticsSaveMutation.mutate([
              { name: 'disable_statistics', value: values.disable_statistics },
              { name: 'disable_statistics_export', value: values.disable_statistics_export },
            ])
          }
        />
      </Card>
    </Space>
  );
}

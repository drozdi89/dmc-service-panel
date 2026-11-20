import { Alert, Card, Form, Space, Typography, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  FTP_QUERY_KEY,
  SETTINGS_BUNDLE_QUERY_KEY,
  TELE_BOT_QUERY_KEY,
  WATCHDOG_QUERY_KEY,
  saveFtpConfiguration,
  saveMarkingOptionsBatch,
  saveTeleBotSetting,
  saveWatchdogConfiguration,
  useFtpConfigurationQuery,
  useSettingsBundleQuery,
  useSlaveConfigurationQuery,
  useTeleBotSettingQuery,
  useWatchdogConfigurationQuery,
  validateBatchTemplate,
  type MarkingOptionEntry,
} from '@/entities/parameters';
import { FactoryNumbersSection } from '@/features/parameters-factory-numbers';
import { FtpSection, type FtpFormValues } from '@/features/parameters-ftp';
import {
  MarkingOptionsSection,
  type MarkingOptionsFormValues,
} from '@/features/parameters-marking-options';
import { StatisticsSection, type StatisticsFormValues } from '@/features/parameters-statistics';
import { TelegramSection, type TelegramFormValues } from '@/features/parameters-telegram';
import { WatchdogSection } from '@/features/parameters-watchdog';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import { PageSpinner } from '@/shared/ui/loading';

/**
 * Converts marking form values to batch API entries.
 *
 * @param values - Form values from MarkingOptionsSection.
 * @param isSlaveMode - When true, slave-hidden fields are omitted.
 */
function markingFormToBatchEntries(
  values: MarkingOptionsFormValues,
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
  const queryClient = useQueryClient();
  const [markingForm] = Form.useForm<MarkingOptionsFormValues>();
  const [telegramForm] = Form.useForm<TelegramFormValues>();
  const [ftpForm] = Form.useForm<FtpFormValues>();
  const [watchdogForm] = Form.useForm<{ enabled: boolean; port: number }>();
  const [statisticsForm] = Form.useForm<StatisticsFormValues>();

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

  const invalidateBundle = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SETTINGS_BUNDLE_QUERY_KEY });
  }, [queryClient]);

  const markingSaveMutation = useMutation({
    mutationFn: async (values: MarkingOptionsFormValues) => {
      const templateError = validateBatchTemplate(values.batch_template);
      if (templateError) {
        throw new Error(templateError);
      }
      return saveMarkingOptionsBatch(markingFormToBatchEntries(values, isSlaveMode));
    },
    onSuccess: () => {
      message.success('Настройки маркировки сохранены');
      invalidateBundle();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const telegramSaveMutation = useMutation({
    mutationFn: async (values: TelegramFormValues) => {
      return saveTeleBotSetting(
        { api_token: values.api_token, is_activ: values.is_activ },
        teleBotQuery.data?.bot_setting_id ?? null,
        createIdempotencyKey(),
      );
    },
    onSuccess: () => {
      message.success('Настройки Telegram сохранены');
      void queryClient.invalidateQueries({ queryKey: TELE_BOT_QUERY_KEY });
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const ftpSaveMutation = useMutation({
    mutationFn: (values: FtpFormValues) =>
      saveFtpConfiguration(values, createIdempotencyKey()),
    onSuccess: () => {
      message.success('Настройки FTP сохранены');
      void queryClient.invalidateQueries({ queryKey: FTP_QUERY_KEY });
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const watchdogSaveMutation = useMutation({
    mutationFn: (values: { enabled: boolean; port: number }) =>
      saveWatchdogConfiguration(values, createIdempotencyKey()),
    onSuccess: () => {
      message.success('Настройки Watchdog сохранены');
      void queryClient.invalidateQueries({ queryKey: WATCHDOG_QUERY_KEY });
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const statisticsSaveMutation = useMutation({
    mutationFn: (values: StatisticsFormValues) =>
      saveMarkingOptionsBatch([
        { name: 'disable_statistics', value: values.disable_statistics },
        { name: 'disable_statistics_export', value: values.disable_statistics_export },
      ]),
    onSuccess: () => {
      message.success('Настройки статистики сохранены');
      invalidateBundle();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

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
          onSave={(values) => markingSaveMutation.mutate(values)}
        />
      </Card>

      <Card title="Telegram">
        <TelegramSection
          form={telegramForm}
          initialSetting={teleBotQuery.data}
          saving={telegramSaveMutation.isPending}
          onSave={(values) => telegramSaveMutation.mutate(values)}
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
          onSave={(values) => statisticsSaveMutation.mutate(values)}
        />
      </Card>
    </Space>
  );
}

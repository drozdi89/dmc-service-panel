import { Checkbox, Form, Space } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect, useRef } from 'react';
import type { ParametersSettingsBundle } from '@/entities/parameters';
import { ButtonLoading } from '@/shared/ui/loading';

/** Props for statistics section at the bottom of Parameters page. */
export interface StatisticsSectionProps {
  form: FormInstance<ParametersSettingsBundle>;
  initialValues: ParametersSettingsBundle | undefined;
  saving: boolean;
  onSave: (values: ParametersSettingsBundle) => void;
}

/**
 * Statistics collection toggles — parity with Qt `tab_service` checkboxes.
 */
export function StatisticsSection({
  form,
  initialValues,
  saving,
  onSave,
}: StatisticsSectionProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initialValues && !initializedRef.current) {
      form.setFieldsValue(initialValues);
      initializedRef.current = true;
    }
  }, [form, initialValues]);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Space direction="vertical" size="small">
        <Form.Item name="disable_statistics" valuePropName="checked" noStyle>
          <Checkbox>Отключить сбор статистики</Checkbox>
        </Form.Item>
        <Form.Item name="disable_statistics_export" valuePropName="checked" noStyle>
          <Checkbox>Отключить выгрузку статистики</Checkbox>
        </Form.Item>
      </Space>
      <Form.Item style={{ marginTop: 16 }}>
        <ButtonLoading type="primary" htmlType="submit" loading={saving}>
          Сохранить настройки статистики
        </ButtonLoading>
      </Form.Item>
    </Form>
  );
}

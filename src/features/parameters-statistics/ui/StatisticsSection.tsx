import { Checkbox, Form, Space } from 'antd';
import { useEffect } from 'react';
import { useStatisticsSettings, type StatisticsSettings } from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';

/**
 * Statistics collection toggles — parity with Qt `tab_service` checkboxes.
 * Loads and saves its own data; toasts come from the entity hook.
 */
export function StatisticsSection() {
  const [form] = Form.useForm<StatisticsSettings>();
  const { values, isLoading, error, save, isSaving } = useStatisticsSettings();

  useEffect(() => {
    if (!isLoading && values) {
      form.setFieldsValue(values);
    }
  }, [form, isLoading, values]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки статистики"
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <Space orientation="vertical" size="small">
          <Form.Item name="disable_statistics" valuePropName="checked" noStyle>
            <Checkbox>Отключить сбор статистики</Checkbox>
          </Form.Item>
          <Form.Item name="disable_statistics_export" valuePropName="checked" noStyle>
            <Checkbox>Отключить выгрузку статистики</Checkbox>
          </Form.Item>
        </Space>
        <Form.Item style={{ marginTop: 16 }}>
          <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
            Сохранить настройки статистики
          </ButtonLoading>
        </Form.Item>
      </Form>
    </QueryStateBoundary>
  );
}
